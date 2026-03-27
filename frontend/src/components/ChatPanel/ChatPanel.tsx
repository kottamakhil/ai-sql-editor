import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Markdown from 'react-markdown';
import { useChat, useConversations, useConversation } from '../../actions/plans';
import { useQueryClient } from '@tanstack/react-query';
import { ClarificationCard } from '../ClarificationCard/ClarificationCard';
import type { ClarificationQuestion } from '../../types';
import type { DisplayMessage, ChatPanelProps } from './ChatPanel.types';
import {
  Panel,
  MessagesArea,
  MessageBubble,
  InputArea,
  InputWrapper,
  Textarea,
  SendBtn,
  EmptyChat,
  ClarificationWrapper,
  ThinkingIndicator,
} from './ChatPanel.styles';

export function ChatPanel({ planId }: ChatPanelProps) {
  const [pendingMessages, setPendingMessages] = useState<DisplayMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<ClarificationQuestion[] | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [collectedAnswers, setCollectedAnswers] = useState<{ question: string; answer: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const chatMutation = useChat();
  const { data: conversations } = useConversations(planId);
  const latestConvId = conversations?.[0]?.conversation_id ?? null;
  const activeConvId = conversationId || latestConvId;
  const { data: existingConv } = useConversation(activeConvId);

  if (existingConv && !conversationId) {
    setConversationId(existingConv.conversation_id);
  }

  const serverMessages: DisplayMessage[] = useMemo(() => {
    if (!existingConv) return [];
    return existingConv.messages.map((m) => ({ role: m.role, content: m.content }));
  }, [existingConv]);

  const messages = useMemo(() => {
    if (pendingMessages.length === 0) return serverMessages;
    if (serverMessages.length > 0) {
      const lastServer = serverMessages[serverMessages.length - 1];
      const firstPending = pendingMessages[0];
      if (lastServer.content === firstPending.content && lastServer.role === firstPending.role) {
        return serverMessages;
      }
    }
    return [...serverMessages, ...pendingMessages];
  }, [serverMessages, pendingMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, pendingQuestions]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const canSend = input.trim().length > 0 && !isThinking;

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isThinking) return;

    setPendingMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsThinking(true);
    setPendingQuestions(null);

    chatMutation.mutate(
      {
        message: text,
        conversation_id: conversationId,
      },
      {
        onSuccess: (res) => {
          setConversationId(res.conversation_id);
          setPendingMessages((prev) => [
            ...prev,
            { role: 'assistant', content: res.response },
          ]);
          setIsThinking(false);

          if (res.pending_questions && res.pending_questions.length > 0) {
            setPendingQuestions(res.pending_questions);
            setQuestionIndex(0);
            setCollectedAnswers([]);
          }

          queryClient.invalidateQueries({ queryKey: ['plan', planId] });
          queryClient.invalidateQueries({ queryKey: ['conversations', planId] });
          queryClient.invalidateQueries({ queryKey: ['conversation', res.conversation_id] }).then(() => {
            setPendingMessages([]);
          });
        },
        onError: () => {
          setPendingMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
          ]);
          setIsThinking(false);
        },
      },
    );
  }, [isThinking, conversationId, chatMutation, queryClient, planId]);

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

  return (
    <Panel>
      {messages.length === 0 && !isThinking ? (
        <EmptyChat>
          Ask a question or request a change to start building your plan with AI.
        </EmptyChat>
      ) : (
        <MessagesArea>
          {messages.map((msg, i) => (
            <MessageBubble key={i} $role={msg.role}>
              {msg.role === 'assistant' ? (
                <Markdown>{msg.content}</Markdown>
              ) : (
                msg.content
              )}
            </MessageBubble>
          ))}
          {isThinking && (
            <ThinkingIndicator>
              <span>.</span><span>.</span><span>.</span> Thinking
            </ThinkingIndicator>
          )}
          {pendingQuestions && !isThinking && (
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
  );
}
