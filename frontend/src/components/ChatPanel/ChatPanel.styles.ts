import styled from 'styled-components';

export const thinScrollbar = `
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
  &::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
  scrollbar-width: thin;
  scrollbar-color: #d1d5db transparent;
`;

export const Panel = styled.div`
  width: 360px;
  min-width: 360px;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafafa;
`;

export const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  ${thinScrollbar}
`;

export const MessageBubble = styled.div<{ $role: string }>`
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

export const InputArea = styled.div`
  border-top: 1px solid #e5e7eb;
  padding: 12px;
  background: #fff;
`;

export const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 8px 12px;
  background: #fff;
`;

export const Textarea = styled.textarea`
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

export const SendBtn = styled.button<{ $active: boolean }>`
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

export const EmptyChat = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
`;

export const ThinkingIndicator = styled.div`
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
