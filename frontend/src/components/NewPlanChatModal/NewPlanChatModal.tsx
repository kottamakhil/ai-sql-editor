import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';
import { useChat } from '../../actions/plans';
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
} from './NewPlanChatModal.styles';

export function NewPlanChatModal({ onClose }: NewPlanChatModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const chatMutation = useChat();

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<ClarificationQuestion[] | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [collectedAnswers, setCollectedAnswers] = useState<{ question: string; answer: string }[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, pendingQuestions]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, []);

  const hasStarted = messages.length > 0 || isThinking;
  const canSend = input.trim().length > 0 && !isThinking;

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isThinking) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsThinking(true);
    setPendingQuestions(null);

    chatMutation.mutate(
      { message: text, conversation_id: conversationId },
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
  }, [isThinking, conversationId, chatMutation, queryClient, navigate, onClose]);

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
            <WelcomeHint>
              <h3>Describe your compensation plan</h3>
              <p>Tell us about your plan and we'll help you build it with AI.</p>
            </WelcomeHint>
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
          <InputWrapper>
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
