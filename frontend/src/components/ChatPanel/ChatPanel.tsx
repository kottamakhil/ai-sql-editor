import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Markdown from 'react-markdown';
import { streamChat, useConversations, useConversation, usePlan } from '../../actions/plans';
import { useQueryClient } from '@tanstack/react-query';
import { ClarificationCard } from '../ClarificationCard/ClarificationCard';
import { ThinkingProgress } from '../ThinkingProgress/ThinkingProgress';
import { PlanTakeover } from '../PlanTakeover/PlanTakeover';
import { useBridge, bridgeClear } from '../../streaming/streamBridge';
import type { ClarificationQuestion, StreamEvent, StreamArtifactEvent, ChatResponse } from '../../types';
import type { ThinkingStep } from '../ThinkingProgress/ThinkingProgress.types';
import type { DisplayMessage, ChatPanelProps } from './ChatPanel.types';
import {
  PanelWrapper,
  ResizeHandle,
  Panel,
  MessagesArea,
  MessageBubble,
  InputArea,
  InputWrapper,
  Textarea,
  SendBtn,
  EmptyChat,
  ClarificationWrapper,
  ShimmerBubble,
  ShimmerLine,
  SqlChip,
} from './ChatPanel.styles';

const MIN_WIDTH = 280;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 360;

function stripCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function isQaAnswers(content: string): boolean {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return false;
  const qaLines = lines.filter((l) => /^.{5,}\?:\s/.test(l));
  return qaLines.length >= 1 && qaLines.length / lines.length >= 0.5;
}

function reorderQaBeforeDone(msgs: DisplayMessage[]): DisplayMessage[] {
  if (msgs.length < 2) return msgs;
  const result = [...msgs];
  for (let i = result.length - 1; i >= 1; i--) {
    if (
      result[i].role === 'user' &&
      isQaAnswers(result[i].content) &&
      result[i - 1].role === 'assistant'
    ) {
      const [qa] = result.splice(i, 1);
      result.splice(i - 1, 0, qa);
    }
  }
  return result;
}

const TOOL_LABELS: Record<string, string> = {
  create_plan: 'Creating plan',
  update_plan: 'Updating plan details',
  update_plan_config: 'Configuring plan settings',
  update_sql_artifacts: 'Building SQL artifacts',
  execute_query: 'Running query',
  validate_sql: 'Validating SQL',
  infer_plan_config: 'Analyzing plan configuration',
  ask_clarification: 'Preparing clarification questions',
};

const THINKING_KEY = (id: string) => `plan_thinking_${id}`;

function loadStoredThinking(planId: string): { steps: ThinkingStep[]; complete: boolean; totalMs?: number } {
  try {
    const raw = localStorage.getItem(THINKING_KEY(planId));
    if (!raw) return { steps: [], complete: false };
    const data = JSON.parse(raw);
    return { steps: data.steps ?? [], complete: true, totalMs: data.totalMs };
  } catch {
    return { steps: [], complete: false };
  }
}

export function ChatPanel({ planId }: ChatPanelProps) {
  const bridge = useBridge();
  const [bridgeConsumed, setBridgeConsumed] = useState(false);

  const [pendingMessages, setPendingMessages] = useState<DisplayMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const { data: planData } = usePlan(planId);
  const stored = useMemo(() => loadStoredThinking(planId), [planId]);

  const fallbackSteps = useMemo<ThinkingStep[]>(() => {
    if (stored.steps.length > 0) return [];
    const arts = planData?.artifacts;
    if (!arts || arts.length === 0) return [];
    return [{
      tool: 'update_sql_artifacts',
      label: 'Building SQL artifacts',
      status: 'complete' as const,
      startedAt: 0,
      artifacts: arts
        .filter((a) => a.name && a.sql_expression)
        .map((a) => ({
          type: 'artifact' as const,
          name: a.name!,
          sql: a.sql_expression,
          columns: [] as string[],
          rows: [] as unknown[][],
          row_count: 0,
          status: 'success' as const,
        })),
    }];
  }, [stored.steps.length, planData?.artifacts]);

  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>(stored.steps);
  const [thinkingComplete, setThinkingComplete] = useState(stored.complete);
  const [thinkingTotalMs, setThinkingTotalMs] = useState<number | undefined>(stored.totalMs);
  const thinkingStartRef = useRef<number>(0);
  const [pendingQuestions, setPendingQuestions] = useState<ClarificationQuestion[] | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [collectedAnswers, setCollectedAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isDragging, setIsDragging] = useState(false);
  const [takeoverArtifactName, setTakeoverArtifactName] = useState<string | null>(null);
  const [showSqlTakeover, setShowSqlTakeover] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const bridgeHasPlan = !!bridge.planId;
  const bridgeActive = bridgeHasPlan && (bridge.isStreaming || (bridge.thinkingComplete && !bridgeConsumed));

  // Handle bridge stream completion — pick up response from modal's stream (only when a plan was created)
  useEffect(() => {
    if (!bridge.thinkingComplete || bridgeConsumed || !bridgeHasPlan) return;
    setBridgeConsumed(true);

    // Transfer bridge thinking steps to local state so ThinkingProgress persists after bridge is cleared
    if (bridge.steps.length > 0) {
      setThinkingSteps([...bridge.steps]);
      setThinkingComplete(true);
      setThinkingTotalMs(bridge.thinkingTotalMs);
    }

    if (bridge.error) {
      setPendingMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
      bridgeClear();
      return;
    }

    if (bridge.response) {
      const res = bridge.response;
      setConversationId(res.conversation_id);

      const hasArtifacts = bridge.steps.some((s) => s.artifacts.length > 0);
      const content = hasArtifacts ? stripCodeBlocks(res.response) : res.response;
      if (content.trim()) {
        setPendingMessages((prev) => [
          ...prev,
          { role: 'assistant', content },
        ]);
      }

      if (res.pending_questions && res.pending_questions.length > 0) {
        setPendingQuestions(res.pending_questions as ClarificationQuestion[]);
        setQuestionIndex(0);
        setCollectedAnswers([]);
      }

      queryClient.invalidateQueries({ queryKey: ['plan', planId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', planId] });
      queryClient.invalidateQueries({ queryKey: ['conversation', res.conversation_id] }).then(() => {
        setPendingMessages([]);
        bridgeClear();
      });
    }
  }, [bridge.thinkingComplete, bridge.response, bridge.error, bridgeConsumed, bridgeHasPlan, queryClient, planId]);

  // Reset bridgeConsumed when a new bridge stream starts
  useEffect(() => {
    if (bridge.isStreaming && bridgeConsumed) {
      setBridgeConsumed(false);
    }
  }, [bridge.isStreaming, bridgeConsumed]);

  // Reconstruct thinking steps from plan artifacts when no stored steps exist
  useEffect(() => {
    if (fallbackSteps.length > 0 && thinkingSteps.length === 0 && !isStreaming) {
      setThinkingSteps(fallbackSteps);
      setThinkingComplete(true);
    }
  }, [fallbackSteps, thinkingSteps.length, isStreaming]);

  // Persist thinking steps to localStorage so they survive page revisits
  useEffect(() => {
    if (thinkingComplete && thinkingSteps.length > 0) {
      try {
        localStorage.setItem(
          THINKING_KEY(planId),
          JSON.stringify({ steps: thinkingSteps, totalMs: thinkingTotalMs }),
        );
      } catch { /* quota exceeded — non-critical */ }
    }
  }, [thinkingComplete, thinkingSteps, thinkingTotalMs, planId]);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      setPanelWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  const { data: conversations, isLoading: convsLoading } = useConversations(planId);
  const latestConvId = conversations?.[0]?.conversation_id ?? null;
  const activeConvId = conversationId || latestConvId;
  const { data: existingConv, isLoading: convLoading } = useConversation(activeConvId);
  const isLoadingConversation = convsLoading || (!!activeConvId && convLoading);

  if (existingConv && !conversationId) {
    setConversationId(existingConv.conversation_id);
  }

  const serverMessages: DisplayMessage[] = useMemo(() => {
    if (!existingConv) return [];
    return existingConv.messages.map((m) => ({ role: m.role, content: m.content }));
  }, [existingConv]);

  const rawMessages = useMemo(() => {
    if (pendingMessages.length === 0 && serverMessages.length === 0 && bridge.messages.length > 0) {
      return bridge.messages as DisplayMessage[];
    }
    if (pendingMessages.length === 0) return serverMessages;
    if (serverMessages.length > 0) {
      const lastServer = serverMessages[serverMessages.length - 1];
      const firstPending = pendingMessages[0];
      if (lastServer.content === firstPending.content && lastServer.role === firstPending.role) {
        return serverMessages;
      }
    }
    return [...serverMessages, ...pendingMessages];
  }, [serverMessages, pendingMessages, bridge.messages]);

  const messages = useMemo(() => {
    if (rawMessages.length === 0) return rawMessages;
    const stripped = rawMessages.map((msg) => {
      if (msg.role !== 'assistant') return msg;
      let clean = stripCodeBlocks(msg.content);
      if (!clean) return msg;
      const hasComposedRef = /Full composed SQL:/i.test(clean);
      if (hasComposedRef) {
        clean = clean.replace(/Full composed SQL:\s*/gi, '').replace(/\n{3,}/g, '\n\n').trim();
      }
      if (clean === msg.content) return msg;
      return { ...msg, content: clean, _showSqlChip: hasComposedRef };
    });
    return reorderQaBeforeDone(stripped);
  }, [rawMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, thinkingSteps, bridge.steps, pendingQuestions]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const canSend = input.trim().length > 0 && !isStreaming && !bridgeActive;

  const handleStreamEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case 'tool_start': {
        const tool = event.tool ?? 'unknown';
        const label = TOOL_LABELS[tool] ?? tool;
        setThinkingSteps((prev) => [
          ...prev,
          { tool, label, status: 'running', startedAt: Date.now(), artifacts: [] },
        ]);
        break;
      }
      case 'tool_complete': {
        setThinkingSteps((prev) => {
          const updated = [...prev];
          const last = updated.findLast((s) => s.tool === event.tool && s.status === 'running');
          if (last) {
            last.status = event.success ? 'complete' : 'error';
            last.durationMs = event.duration_ms;
          }
          return updated;
        });
        break;
      }
      case 'artifact': {
        setThinkingSteps((prev) => {
          const updated = [...prev];
          const artifactStep = updated.findLast((s) => s.tool === 'update_sql_artifacts');
          if (artifactStep) {
            artifactStep.artifacts = [...artifactStep.artifacts, event];
          }
          return updated;
        });
        break;
      }
      case 'complete': {
        const res = event.data as ChatResponse;
        setConversationId(res.conversation_id);
        setThinkingComplete(true);
        setThinkingTotalMs(Date.now() - thinkingStartRef.current);
        setIsStreaming(false);

        setThinkingSteps((prev) => {
          const hasArt = prev.some((s) => s.artifacts.length > 0);
          const content = hasArt ? stripCodeBlocks(res.response) : res.response;
          if (content.trim()) {
            setPendingMessages((msgs) => [...msgs, { role: 'assistant', content }]);
          }
          return prev;
        });

        if (res.pending_questions && res.pending_questions.length > 0) {
          setPendingQuestions(res.pending_questions as ClarificationQuestion[]);
          setQuestionIndex(0);
          setCollectedAnswers([]);
        }

        queryClient.invalidateQueries({ queryKey: ['plan', planId] });
        queryClient.invalidateQueries({ queryKey: ['conversations', planId] });
        queryClient.invalidateQueries({ queryKey: ['conversation', res.conversation_id] }).then(() => {
          setPendingMessages([]);
        });
        break;
      }
      case 'error': {
        setPendingMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
        ]);
        setIsStreaming(false);
        setThinkingComplete(true);
        break;
      }
    }
  }, [queryClient, planId]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isStreaming) return;

    setPendingMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsStreaming(true);
    setThinkingSteps([]);
    setThinkingComplete(false);
    thinkingStartRef.current = Date.now();
    setThinkingTotalMs(undefined);
    setPendingQuestions(null);

    abortRef.current = streamChat(
      { message: text, conversation_id: conversationId },
      handleStreamEvent,
    );
  }, [isStreaming, conversationId, handleStreamEvent]);

  const handleSend = () => {
    if (!canSend) return;
    const text = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const submitAllAnswers = (answers: { question: string; answer: string }[]) => {
    const grouped = answers
      .filter((a) => a.answer !== 'skipped')
      .map((a) => `${a.question}: ${a.answer}`)
      .join('\n');
    setPendingQuestions(null);
    setCollectedAnswers([]);
    sendMessage(grouped || 'skip all');
  };

  const handleClarificationAnswer = (answer: string) => {
    const q = pendingQuestions?.[questionIndex];
    const entry = { question: q?.question ?? '', answer };
    const updated = [...collectedAnswers, entry];

    if (pendingQuestions && questionIndex < pendingQuestions.length - 1) {
      setCollectedAnswers(updated);
      setQuestionIndex((i) => i + 1);
    } else {
      submitAllAnswers(updated);
    }
  };

  const handleClarificationSkip = () => {
    const q = pendingQuestions?.[questionIndex];
    const entry = { question: q?.question ?? '', answer: 'skipped' };
    const updated = [...collectedAnswers, entry];

    if (pendingQuestions && questionIndex < pendingQuestions.length - 1) {
      setCollectedAnswers(updated);
      setQuestionIndex((i) => i + 1);
    } else {
      submitAllAnswers(updated);
    }
  };

  const handleClarificationClose = () => {
    if (collectedAnswers.length > 0) {
      submitAllAnswers(collectedAnswers);
    } else {
      setPendingQuestions(null);
      setCollectedAnswers([]);
    }
  };

  const showBridgeThinking = bridgeActive && (bridge.isStreaming || bridge.steps.length > 0);
  const hasLocalThinking = isStreaming || (thinkingComplete && thinkingSteps.length > 0);
  const hasAnyThinking = showBridgeThinking || hasLocalThinking;

  const { beforeThinking, afterThinking } = useMemo(() => {
    if (!hasAnyThinking || messages.length === 0) {
      return { beforeThinking: messages, afterThinking: [] as DisplayMessage[] };
    }
    const lastAssistantIdx = messages.findLastIndex((m) => m.role === 'assistant');
    if (lastAssistantIdx <= 0) {
      return { beforeThinking: messages, afterThinking: [] as DisplayMessage[] };
    }
    return {
      beforeThinking: messages.slice(0, lastAssistantIdx),
      afterThinking: messages.slice(lastAssistantIdx),
    };
  }, [messages, hasAnyThinking]);

  const showLoading = isLoadingConversation && !bridgeActive;
  const showEmpty = messages.length === 0 && !isStreaming && !bridgeActive;

  const renderBubble = (msg: DisplayMessage, i: number) => (
    <MessageBubble key={i} $role={msg.role}>
      {msg.role === 'assistant' ? <Markdown>{msg.content}</Markdown> : msg.content}
      {msg._showSqlChip && planData && (
        <SqlChip onClick={() => setShowSqlTakeover(true)}>
          <span>Plan SQL</span>
          <span className="expand" aria-hidden="true">↗</span>
        </SqlChip>
      )}
    </MessageBubble>
  );

  return (
    <PanelWrapper style={{ width: panelWidth }}>
      <ResizeHandle
        ref={handleRef}
        className={isDragging ? 'active' : ''}
        onMouseDown={() => setIsDragging(true)}
      />
      <Panel>
        {showLoading ? (
          <MessagesArea>
            <ShimmerBubble style={{ width: '60%' }}>
              <ShimmerLine $width="50%" />
              <ShimmerLine $width="80%" />
            </ShimmerBubble>
            <ShimmerBubble style={{ alignSelf: 'flex-end', width: '55%' }}>
              <ShimmerLine $width="70%" />
            </ShimmerBubble>
            <ShimmerBubble style={{ width: '70%' }}>
              <ShimmerLine $width="90%" />
              <ShimmerLine $width="65%" />
              <ShimmerLine $width="45%" />
            </ShimmerBubble>
          </MessagesArea>
        ) : showEmpty ? (
          <EmptyChat>
            Ask a question or request a change to start building your plan with AI.
          </EmptyChat>
        ) : (
          <MessagesArea>
            {beforeThinking.map(renderBubble)}

            {/* Bridge stream progress (from modal handoff) */}
            {showBridgeThinking && (
              <ThinkingProgress
                steps={bridge.steps}
                isComplete={bridge.thinkingComplete}
                totalDurationMs={bridge.thinkingTotalMs}
                onExpandArtifact={(a) => setTakeoverArtifactName(a.name)}
              />
            )}

            {/* Own stream progress (for messages sent from this panel) */}
            {isStreaming && (
              <ThinkingProgress
                steps={thinkingSteps}
                isComplete={false}
                onExpandArtifact={(a) => setTakeoverArtifactName(a.name)}
              />
            )}
            {!isStreaming && thinkingComplete && thinkingSteps.length > 0 && (
              <ThinkingProgress
                steps={thinkingSteps}
                isComplete={true}
                totalDurationMs={thinkingTotalMs}
                onExpandArtifact={(a) => setTakeoverArtifactName(a.name)}
              />
            )}

            {afterThinking.map((msg, i) => renderBubble(msg, beforeThinking.length + i))}

            {pendingQuestions && !isStreaming && !bridgeActive && (
              <ClarificationWrapper>
                <ClarificationCard
                  questions={pendingQuestions}
                  currentIndex={questionIndex}
                  onAnswer={handleClarificationAnswer}
                  onSkip={handleClarificationSkip}
                  onClose={handleClarificationClose}
                />
              </ClarificationWrapper>
            )}
            <div ref={messagesEndRef} />
          </MessagesArea>
        )}

        <InputArea>
          <InputWrapper>
            <Textarea
              ref={textareaRef}
              rows={2}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or request a change..."
            />
            <SendBtn $active={canSend} onClick={handleSend} title="Send">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </SendBtn>
          </InputWrapper>
        </InputArea>
      </Panel>

      {takeoverArtifactName && planData && (
        <PlanTakeover
          plan={planData}
          initialArtifactName={takeoverArtifactName}
          onClose={() => setTakeoverArtifactName(null)}
        />
      )}

      {showSqlTakeover && planData && (
        <PlanTakeover
          plan={planData}
          initialViewMode="config"
          onClose={() => setShowSqlTakeover(false)}
        />
      )}
    </PanelWrapper>
  );
}
