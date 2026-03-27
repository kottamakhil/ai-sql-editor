import { useState } from 'react';
import type { ChatInputProps } from './ChatInput.types';
import {
  Wrapper,
  TextareaRow,
  Textarea,
  BottomRow,
  AddButton,
  SendButton,
} from './ChatInput.styles';

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
