import styled from 'styled-components';

export const Chip = styled.button`
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
