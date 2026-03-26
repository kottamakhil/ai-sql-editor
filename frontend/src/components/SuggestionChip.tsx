import styled from 'styled-components';

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e9d5ff;
  border-radius: 20px;
  background: #faf5ff;
  color: #6b21a8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: #f3e8ff;
    border-color: #d8b4fe;
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }
`;

interface SuggestionChipProps {
  label: string;
  onClick?: () => void;
}

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
