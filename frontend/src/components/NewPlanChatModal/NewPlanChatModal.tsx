import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { useChat, useSkills, uploadChatFile } from '../../actions/plans';
import { useQueryClient } from '@tanstack/react-query';
import { ClarificationCard } from '../ClarificationCard/ClarificationCard';
import type { ClarificationQuestion } from '../../types';
import type { DisplayMessage, NewPlanChatModalProps } from './NewPlanChatModal.types';
import {
  Overlay,
  Modal,
  ModalHeader,
  ModalTitle,
  CloseBtn,
  MessagesArea,
  WelcomeHint,
  MessageBubble,
  ThinkingIndicator,
  ClarificationWrapper,
  InputArea,
  InputWrapper,
  Textarea,
  SendBtn,
  AttachBtn,
  FileChipsRow,
  FileChip,
  FileChipName,
  FileChipRemove,
  SkillPickerSection,
  SkillPickerLabel,
  SkillChips,
  SkillChip,
  SkillChipSkeleton,
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
  const chatMutation = useChat();
  const { data: skills, isLoading: isLoadingSkills } = useSkills();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<ClarificationQuestion[] | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [collectedAnswers, setCollectedAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, pendingQuestions]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  };

  const hasStarted = messages.length > 0 || isThinking;
  const canSend = (input.trim().length > 0 || pendingFiles.length > 0) && !isThinking && !isUploading;

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
    if ((!hasText && !hasFiles) || isThinking) return;

    const displayText = hasText ? text : `Attached ${fileIds!.length} file${fileIds!.length > 1 ? 's' : ''}`;
    setMessages((prev) => [...prev, { role: 'user', content: displayText }]);
    setIsThinking(true);
    setPendingQuestions(null);

    const payload: { message: string; conversation_id: string | null; skill_ids?: string[]; file_ids?: string[] } = {
      message: hasText ? text : 'Please analyze the attached file(s).',
      conversation_id: conversationId,
    };
    if (!conversationId && selectedSkills.size > 0) {
      payload.skill_ids = Array.from(selectedSkills);
    }
    if (fileIds && fileIds.length > 0) {
      payload.file_ids = fileIds;
    }

    chatMutation.mutate(
      payload,
      {
        onSuccess: (res) => {
          setConversationId(res.conversation_id);
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: res.response },
          ]);
          setIsThinking(false);

          if (res.pending_questions && res.pending_questions.length > 0) {
            setPendingQuestions(res.pending_questions);
            setQuestionIndex(0);
            setCollectedAnswers([]);
          }

          if (res.plan) {
            queryClient.invalidateQueries({ queryKey: ['plans'] });
            onClose();
            navigate(`/variable-compensation/plans/${res.plan.plan_id}`);
          }
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
          ]);
          setIsThinking(false);
        },
      },
    );
  }, [isThinking, conversationId, selectedSkills, chatMutation, queryClient, navigate, onClose]);

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
    <Overlay onClick={handleOverlayClick}>
      <Modal>
        <ModalHeader>
          <ModalTitle>New Plan</ModalTitle>
          <CloseBtn onClick={onClose} title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </CloseBtn>
        </ModalHeader>

        <MessagesArea>
          {!hasStarted && (
            <>
              <WelcomeHint>
                <h3>Describe your compensation plan</h3>
                <p>Tell us about your plan and we'll help you build it with AI.</p>
              </WelcomeHint>
              {isLoadingSkills ? (
                <SkillPickerSection>
                  <SkillPickerLabel>Skills to include</SkillPickerLabel>
                  <SkillChips>
                    <SkillChipSkeleton /><SkillChipSkeleton /><SkillChipSkeleton />
                  </SkillChips>
                </SkillPickerSection>
              ) : skills && skills.length > 0 ? (
                <SkillPickerSection>
                  <SkillPickerLabel>Skills to include</SkillPickerLabel>
                  <SkillChips>
                    {skills.map((skill) => (
                      <SkillChip
                        key={skill.skill_id}
                        $selected={selectedSkills.has(skill.skill_id)}
                        onClick={() => toggleSkill(skill.skill_id)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {selectedSkills.has(skill.skill_id) ? (
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          ) : (
                            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                          )}
                        </svg>
                        {skill.name}
                      </SkillChip>
                    ))}
                  </SkillChips>
                </SkillPickerSection>
              ) : null}
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

          {isThinking && (
            <ThinkingIndicator>
              Thinking <span><i>.</i><i>.</i><i>.</i></span>
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
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </AttachBtn>
            <Textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKeyDown}
              placeholder="Describe your compensation plans..."
              autoFocus
            />
            <SendBtn $active={canSend} onClick={handleSend} title="Send">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </SendBtn>
          </InputWrapper>
        </InputArea>
      </Modal>
    </Overlay>
  );
}
