import { useState } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  width: 100%;
  max-width: 620px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
`;

const TextareaRow = styled.div`
  padding: 14px 16px 8px;
`;

const Textarea = styled.textarea`
  width: 100%;
  border: none;
  outline: none;
  resize: none;
  font-size: 14px;
  color: #1a1a2e;
  font-family: inherit;
  line-height: 1.5;
  min-height: 24px;
  max-height: 120px;
  background: transparent;

  &::placeholder {
    color: #9ca3af;
  }
`;

const BottomRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 8px;
`;

const AddButton = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #6b7280;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const SendButton = styled.button<{ $active: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: ${(p) => (p.$active ? '#5b1647' : '#e5e7eb')};
  color: ${(p) => (p.$active ? '#fff' : '#9ca3af')};
  cursor: ${(p) => (p.$active ? 'pointer' : 'default')};
  transition: all 0.15s ease;

  &:hover {
    background: ${(p) => (p.$active ? '#4a1239' : '#e5e7eb')};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

interface ChatInputProps {
  placeholder?: string;
  onSend?: (message: string) => void;
}

export function ChatInput({ placeholder, onSend }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onSend?.(trimmed);
      setValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Wrapper>
      <TextareaRow>
        <Textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
      </TextareaRow>
      <BottomRow>
        <AddButton title="Attach">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </AddButton>
        <SendButton $active={value.trim().length > 0} onClick={handleSend} title="Send">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </SendButton>
      </BottomRow>
    </Wrapper>
  );
}
