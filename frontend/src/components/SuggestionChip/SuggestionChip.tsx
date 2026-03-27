import type { SuggestionChipProps } from './SuggestionChip.types';
import { Chip } from './SuggestionChip.styles';

export function SuggestionChip({ label, onClick }: SuggestionChipProps) {
  return (
    <Chip onClick={onClick}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5L18.2 21 12 16.5 5.8 21l2.4-7.1L2 9.4h7.6L12 2z" strokeLinejoin="round" />
      </svg>
      {label}
    </Chip>
  );
}
