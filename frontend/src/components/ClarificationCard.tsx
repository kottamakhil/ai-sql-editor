import { useState } from 'react';
import styled from 'styled-components';
import type { ClarificationQuestion } from '../types';

const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  width: 100%;
  max-width: 600px;
`;

const CardHeader = styled.div`
  padding: 16px 20px 12px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const QuestionText = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
  line-height: 1.4;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const Counter = styled.span`
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
`;

const CloseBtn = styled.button`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  &:hover { background: #f3f4f6; color: #6b7280; }
  svg { width: 14px; height: 14px; }
`;

const OptionsList = styled.div`
  padding: 0 20px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const OptionRow = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: #1a1a2e;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  line-height: 1.4;
  transition: background 0.15s ease;
  &:hover { background: #2d2d4a; }
`;

const OptionNumber = styled.span`
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.15);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
`;

const OptionLabel = styled.span`
  flex: 1;
`;

const CardFooter = styled.div`
  padding: 8px 20px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FreetextRow = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #9ca3af;
  svg { width: 14px; height: 14px; flex-shrink: 0; }
`;

const FreetextInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  color: #1a1a2e;
  font-family: inherit;
  background: transparent;
  &::placeholder { color: #9ca3af; }
`;

const SkipBtn = styled.button`
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: none;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: #f3f4f6; color: #374151; }
`;

const SendFreetextBtn = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: #5b1647;
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  &:hover { background: #4a1239; }
  svg { width: 12px; height: 12px; }
`;

interface ClarificationCardProps {
  questions: ClarificationQuestion[];
  currentIndex: number;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
  onClose: () => void;
}

export function ClarificationCard({
  questions,
  currentIndex,
  onAnswer,
  onSkip,
  onClose,
}: ClarificationCardProps) {
  const [freetext, setFreetext] = useState('');
  const question = questions[currentIndex];
  if (!question) return null;

  const handleFreetext = () => {
    if (!freetext.trim()) return;
    onAnswer(freetext.trim());
    setFreetext('');
  };

  return (
    <Card>
      <CardHeader>
        <QuestionText>{question.question}</QuestionText>
        <HeaderRight>
          {questions.length > 1 && (
            <Counter>{currentIndex + 1} of {questions.length}</Counter>
          )}
          <CloseBtn onClick={onClose} title="Dismiss">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </CloseBtn>
        </HeaderRight>
      </CardHeader>

      <OptionsList>
        {question.options.map((opt, i) => (
          <OptionRow key={opt.value} onClick={() => onAnswer(opt.label)}>
            <OptionNumber>{i + 1}</OptionNumber>
            <OptionLabel>{opt.label}</OptionLabel>
          </OptionRow>
        ))}
      </OptionsList>

      <CardFooter>
        {question.allow_freetext !== false && (
          <FreetextRow>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <FreetextInput
              value={freetext}
              onChange={(e) => setFreetext(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleFreetext(); }}
              placeholder="Something else"
            />
            {freetext.trim() && (
              <SendFreetextBtn onClick={handleFreetext}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </SendFreetextBtn>
            )}
          </FreetextRow>
        )}
        <SkipBtn onClick={onSkip}>Skip</SkipBtn>
      </CardFooter>
    </Card>
  );
}
