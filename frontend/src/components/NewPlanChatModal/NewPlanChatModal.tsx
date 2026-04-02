import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { uploadChatFile } from '../../actions/plans';
import { useQueryClient } from '@tanstack/react-query';
import { ClarificationCard } from '../ClarificationCard/ClarificationCard';
import { ThinkingProgress } from '../ThinkingProgress/ThinkingProgress';
import { useBridge, bridgeStart, bridgeClear } from '../../streaming/streamBridge';
import type { ClarificationQuestion } from '../../types';
import type { DisplayMessage, NewPlanChatModalProps } from './NewPlanChatModal.types';
import {
  Overlay,
  Modal,
  CloseBtn,
  MessagesArea,
  WelcomeHint,
  WelcomeInput,
  MessageBubble,
  ClarificationWrapper,
  InputArea,
  InputWrapper,
  ActionGroup,
  Textarea,
  SendBtn,
  AttachBtn,
  FileChipsRow,
  FileChip,
  FileChipName,
  FileChipRemove,
} from './NewPlanChatModal.styles';

const ALLOWED_MIME_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf', 'text/csv', 'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const ALLOWED_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'csv', 'xlsx', 'docx',
]);
const MAX_FILE_SIZE = 20 * 1024 * 1024;

function isFileAllowed(file: File): boolean {
  if (ALLOWED_MIME_TYPES.has(file.type)) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return ALLOWED_EXTENSIONS.has(ext);
}

interface PendingFile {
  file: File;
  filename: string;
}

export function NewPlanChatModal({ onClose }: NewPlanChatModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bridge = useBridge();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [pendingQuestions, setPendingQuestions] = useState<ClarificationQuestion[] | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [collectedAnswers, setCollectedAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  /* Artifact expansion not available in modal — user navigates to plan page first */

  const [navigated, setNavigated] = useState(false);
  const [handledComplete, setHandledComplete] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigate immediately when plan is created (early, before stream finishes)
  useEffect(() => {
    if (bridge.planId && !navigated) {
      // eslint-disable-next-line -- responding to external store change
      setNavigated(true);
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      onClose();
      navigate(`/variable-compensation/plans/${bridge.planId}`);
    }
  }, [bridge.planId, navigated, queryClient, onClose, navigate]);

  // Handle stream completion when modal is still open (no plan created — e.g. clarification only)
  useEffect(() => {
    if (!bridge.thinkingComplete || navigated || handledComplete) return;
    // eslint-disable-next-line -- responding to external store change
    setHandledComplete(true);

    if (bridge.error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
      bridgeClear();
      return;
    }

    if (bridge.response) {
      const res = bridge.response;
      setConversationId(res.conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.response },
      ]);

      if (res.pending_questions && res.pending_questions.length > 0) {
        setPendingQuestions(res.pending_questions as ClarificationQuestion[]);
        setQuestionIndex(0);
        setCollectedAnswers([]);
      }

      if (res.plan) {
        queryClient.invalidateQueries({ queryKey: ['plans'] });
        onClose();
        navigate(`/variable-compensation/plans/${res.plan.plan_id}`);
      }

      bridgeClear();
    }
  }, [bridge.thinkingComplete, bridge.error, bridge.response, navigated, handledComplete, queryClient, onClose, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, bridge.isStreaming, bridge.steps, pendingQuestions]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const hasStarted = messages.length > 0 || bridge.isStreaming;
  const canSend = (input.trim().length > 0 || pendingFiles.length > 0) && !bridge.isStreaming && !isUploading;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    e.target.value = '';

    const valid: PendingFile[] = [];
    for (const file of files) {
      if (!isFileAllowed(file)) {
        alert(`Unsupported file type: ${file.name}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert(`File too large (max 20 MB): ${file.name}`);
        continue;
      }
      valid.push({ file, filename: file.name });
    }
    if (valid.length > 0) {
      setPendingFiles((prev) => [...prev, ...valid]);
    }
  };

  const removeFile = (filename: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.filename !== filename));
  };

  const sendMessage = useCallback((text: string, fileIds?: string[]) => {
    const hasText = text.trim().length > 0;
    const hasFiles = fileIds && fileIds.length > 0;
    if ((!hasText && !hasFiles) || bridge.isStreaming) return;

    const displayText = hasText ? text : `Attached ${fileIds!.length} file${fileIds!.length > 1 ? 's' : ''}`;
    const newUserMsg = { role: 'user', content: displayText };
    setMessages((prev) => [...prev, newUserMsg]);
    setPendingQuestions(null);
    setNavigated(false);
    setHandledComplete(false);

    const payload: { message: string; conversation_id: string | null; skill_ids?: string[]; file_ids?: string[] } = {
      message: hasText ? text : 'Please analyze the attached file(s).',
      conversation_id: conversationId,
    };
    if (fileIds && fileIds.length > 0) {
      payload.file_ids = fileIds;
    }

    const bridgeMessages = [...messages, newUserMsg].filter((m) => m.role === 'user');
    bridgeStart(payload, bridgeMessages);
  }, [bridge.isStreaming, conversationId, messages]);

  const handleSend = async () => {
    if (!canSend) return;
    const text = input.trim();
    const filesToUpload = [...pendingFiles];
    setInput('');
    setPendingFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    let fileIds: string[] | undefined;
    if (filesToUpload.length > 0) {
      setIsUploading(true);
      try {
        const results = await Promise.all(filesToUpload.map((f) => uploadChatFile(f.file)));
        fileIds = results.map((r) => r.file_id);
      } catch {
        alert('Failed to upload one or more files. Please try again.');
        setPendingFiles(filesToUpload);
        setInput(text);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMessage(text, fileIds);
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

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
    <Overlay onClick={handleOverlayClick}>
      <Modal>
        <CloseBtn onClick={onClose} title="Close">ESC</CloseBtn>
        <MessagesArea>
          {!hasStarted && (
            <>
              <WelcomeHint>
                <WelcomeInput
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={'Tell us about your plan...\n\ne.g. Sales commissions plan, Referral bonus, Annual bonus'}
                  spellCheck={false}
                  autoFocus
                />
              </WelcomeHint>
            </>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} $role={msg.role}>
              {msg.role === 'assistant' ? (
                <Markdown>{msg.content}</Markdown>
              ) : (
                msg.content
              )}
            </MessageBubble>
          ))}

          {bridge.isStreaming && (
            <ThinkingProgress
              steps={bridge.steps}
              isComplete={false}
              onExpandArtifact={() => {}}
            />
          )}

          {pendingQuestions && !bridge.isStreaming && (
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

        <InputArea>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.csv,.xlsx,.docx"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          {pendingFiles.length > 0 && (
            <FileChipsRow>
              {pendingFiles.map((f, i) => (
                <FileChip key={`${f.filename}-${i}`}>
                  <FileChipName>{f.filename}</FileChipName>
                  <FileChipRemove onClick={() => removeFile(f.filename)} title="Remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </FileChipRemove>
                </FileChip>
              ))}
            </FileChipsRow>
          )}
          <InputWrapper>
            <ActionGroup>
              <AttachBtn
                $uploading={isUploading}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                title={isUploading ? 'Uploading...' : 'Attach file'}
              >
                {isUploading ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </AttachBtn>
              <AttachBtn title="Connectors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <ellipse cx="7" cy="6" rx="3.5" ry="1.8" />
                  <path d="M3.5 6v5c0 1 1.6 1.8 3.5 1.8s3.5-.8 3.5-1.8V6" strokeLinecap="round" />
                  <path d="M14 8h4a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 16h4a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="13" cy="12" r="1.5" />
                </svg>
              </AttachBtn>
            </ActionGroup>
            {hasStarted ? (
              <Textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(); }}
                onKeyDown={handleKeyDown}
                placeholder=""
                autoFocus
              />
            ) : (
              <div style={{ flex: 1 }} />
            )}
            <ActionGroup>
              <AttachBtn title="Files">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7h5l2 2h11v10a2 2 0 0 1-2 2H3z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 7V5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </AttachBtn>
              <SendBtn $active={canSend} onClick={handleSend} title="Send">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </SendBtn>
            </ActionGroup>
          </InputWrapper>
        </InputArea>
      </Modal>
    </Overlay>
    </>
  );
}
