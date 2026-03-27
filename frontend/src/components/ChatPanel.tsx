import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import Markdown from 'react-markdown';
import { useChat, useConversations, useConversation } from '../actions/plans';
import { useQueryClient } from '@tanstack/react-query';

const thinScrollbar = `
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
`;

const Panel = styled.div`
  width: 360px;
  min-width: 360px;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafafa;
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  ${thinScrollbar}
`;

const MessageBubble = styled.div<{ $role: string }>`
  max-width: 90%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  align-self: ${(p) => (p.$role === 'user' ? 'flex-end' : 'flex-start')};
  background: ${(p) => (p.$role === 'user' ? '#5b1647' : '#fff')};
  color: ${(p) => (p.$role === 'user' ? '#fff' : '#1a1a2e')};
  border: ${(p) => (p.$role === 'user' ? 'none' : '1px solid #e5e7eb')};
  white-space: ${(p) => (p.$role === 'user' ? 'pre-wrap' : 'normal')};

  p { margin: 0 0 8px; &:last-child { margin-bottom: 0; } }
  ul, ol { margin: 4px 0 8px; padding-left: 20px; }
  li { margin: 2px 0; }
  strong { font-weight: 600; }
  code {
    font-family: 'Fira Code', 'Consolas', monospace;
    font-size: 12px;
    padding: 1px 5px;
    border-radius: 4px;
    background: ${(p) => (p.$role === 'user' ? 'rgba(255,255,255,0.15)' : '#f3f4f6')};
  }
  pre {
    margin: 8px 0;
    padding: 10px;
    border-radius: 6px;
    background: ${(p) => (p.$role === 'user' ? 'rgba(255,255,255,0.1)' : '#1e1e2e')};
    color: ${(p) => (p.$role === 'user' ? '#fff' : '#cdd6f4')};
    overflow-x: auto;
    code { padding: 0; background: none; }
  }
`;

const InputArea = styled.div`
  border-top: 1px solid #e5e7eb;
  padding: 12px;
  background: #fff;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 8px 12px;
  background: #fff;
`;

const Textarea = styled.textarea`
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  font-size: 13px;
  font-family: inherit;
  color: #1a1a2e;
  line-height: 1.5;
  min-height: 40px;
  max-height: 160px;
  overflow-y: auto;
  background: transparent;
  ${thinScrollbar}

  &::placeholder {
    color: #9ca3af;
  }
`;

const SendBtn = styled.button<{ $active: boolean }>`
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: ${(p) => (p.$active ? '#5b1647' : '#e5e7eb')};
  color: ${(p) => (p.$active ? '#fff' : '#9ca3af')};
  cursor: ${(p) => (p.$active ? 'pointer' : 'default')};
  flex-shrink: 0;

  &:hover {
    background: ${(p) => (p.$active ? '#4a1239' : '#e5e7eb')};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const EmptyChat = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
`;

const ThinkingIndicator = styled.div`
  align-self: flex-start;
  padding: 10px 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  font-size: 13px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 8px;

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }

  span {
    animation: pulse 1.4s ease-in-out infinite;
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;

interface DisplayMessage {
  role: string;
  content: string;
}

interface ChatPanelProps {
  planId: string;
}

export function ChatPanel({ planId }: ChatPanelProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const chatMutation = useChat();
  const { data: conversations } = useConversations(planId);
  const latestConvId = conversations?.[0]?.conversation_id ?? null;
  const { data: existingConv } = useConversation(
    conversationId || latestConvId,
  );
  const [loaded, setLoaded] = useState(false);

  const loadExistingConversation = useCallback(() => {
    if (existingConv && !loaded && messages.length === 0) {
      setLoaded(true);
      setConversationId(existingConv.conversation_id);
      setMessages(
        existingConv.messages.map((m) => ({ role: m.role, content: m.content })),
      );
    }
  }, [existingConv, loaded, messages.length]);

  useEffect(() => {
    loadExistingConversation();
  }, [loadExistingConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const canSend = input.trim().length > 0 && !isThinking;

  const handleSend = () => {
    if (!canSend) return;

    const userMsg = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsThinking(true);

    chatMutation.mutate(
      {
        message: userMsg,
        conversation_id: conversationId,
      },
      {
        onSuccess: (res) => {
          setConversationId(res.conversation_id);
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: res.response },
          ]);
          setIsThinking(false);
          queryClient.invalidateQueries({ queryKey: ['plan', planId] });
          queryClient.invalidateQueries({ queryKey: ['conversations', planId] });
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
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
