import styled from 'styled-components';

export const Section = styled.div`
  margin-top: 0;
`;

export const RulesContainer = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
`;

export const MatchTypeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 12px;
`;

export const MatchTypeToggle = styled.button<{ $active: boolean }>`
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid ${(p) => (p.$active ? '#5b1647' : '#d1d5db')};
  background: ${(p) => (p.$active ? '#fdf2f8' : '#fff')};
  color: ${(p) => (p.$active ? '#5b1647' : '#6b7280')};
  transition: all 0.15s ease;

  &:hover {
    border-color: #5b1647;
  }
`;

export const RuleChipsArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 36px;
  align-items: center;
`;

export const RuleChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px 4px 10px;
  background: #f3f0ff;
  border: 1px solid #e0d6f9;
  border-radius: 6px;
  font-size: 13px;
  color: #3b1a7e;

  .chip-field {
    font-weight: 500;
    text-transform: capitalize;
  }

  .chip-arrow {
    color: #9ca3af;
    font-size: 11px;
  }

  .chip-value {
    color: #5b1647;
  }
`;

export const ChipRemoveBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 4px;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;

  &:hover {
    color: #dc2626;
    background: #fef2f2;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

export const AddRuleBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #6b7280;
  cursor: pointer;

  &:hover {
    border-color: #5b1647;
    color: #5b1647;
    background: #fdf2f8;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const PickerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
`;

export const PickerDropdown = styled.div`
  position: absolute;
  z-index: 51;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  max-height: 260px;
  overflow-y: auto;
`;

export const PickerItem = styled.div<{ $active?: boolean }>`
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${(p) => (p.$active ? '#5b1647' : '#1a1a2e')};
  background: ${(p) => (p.$active ? '#fdf2f8' : 'transparent')};
  font-weight: ${(p) => (p.$active ? '500' : '400')};

  &:hover {
    background: ${(p) => (p.$active ? '#fdf2f8' : '#f3f4f6')};
  }
`;

export const PickerBack = styled.div`
  padding: 8px 12px;
  font-size: 12px;
  color: #9ca3af;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  border-bottom: 1px solid #e5e7eb;

  &:hover {
    color: #5b1647;
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

export const PickerHeader = styled.div`
  padding: 8px 12px 4px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #9ca3af;
  font-weight: 600;
`;

export const ExceptDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #dc2626;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #fecaca;
  }
`;

export const ExceptionChip = styled(RuleChip)`
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;

  .chip-field {
    color: #991b1b;
  }
  .chip-value {
    color: #dc2626;
  }
`;

export const PreviewBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
`;

export const PreviewBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    border-color: #9ca3af;
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const MemberCount = styled.span`
  font-size: 13px;
  color: #6b7280;
`;

export const MembersList = styled.div`
  margin-top: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  max-height: 240px;
  overflow-y: auto;
`;

export const MemberRow = styled.div`
  padding: 8px 12px;
  font-size: 13px;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

export const MemberName = styled.span`
  font-weight: 500;
  min-width: 140px;
`;

export const MemberDetail = styled.span`
  color: #6b7280;
  font-size: 12px;
`;

export const SaveBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

export const SaveBtn = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid ${(p) => (p.$variant === 'secondary' ? '#d1d5db' : '#5b1647')};
  background: ${(p) => (p.$variant === 'secondary' ? '#fff' : '#5b1647')};
  color: ${(p) => (p.$variant === 'secondary' ? '#374151' : '#fff')};

  &:hover {
    background: ${(p) => (p.$variant === 'secondary' ? '#f3f4f6' : '#4a1239')};
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

export const CheckIcon = styled.span`
  display: inline-flex;
  align-items: center;
  svg {
    width: 14px;
    height: 14px;
    color: #5b1647;
  }
`;
