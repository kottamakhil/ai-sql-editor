import type { ClarificationQuestion } from '../../types';

export interface ClarificationCardProps {
  questions: ClarificationQuestion[];
  currentIndex: number;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
  onClose: () => void;
}
