import { useState } from 'react';
import type { ClarificationCardProps } from './ClarificationCard.types';
import {
  Card,
  CardHeader,
  QuestionText,
  HeaderRight,
  Counter,
  CloseBtn,
  OptionsList,
  OptionRow,
  OptionNumber,
  OptionLabel,
  CardFooter,
  FreetextRow,
  FreetextInput,
  SkipBtn,
  SendFreetextBtn,
} from './ClarificationCard.styles';

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
