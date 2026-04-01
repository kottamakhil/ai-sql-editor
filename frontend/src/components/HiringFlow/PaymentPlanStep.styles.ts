import styled from 'styled-components';

export const StepContainer = styled.div`
  width: 100%;
`;

export const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 4px;
`;

export const SectionSubtitle = styled.p`
  font-size: 13px;
  color: #9ca3af;
  margin: 0 0 24px;
`;

export const SubHeading = styled.h3`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  margin: 0 0 12px;
`;

export const FieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

export const FieldLabel = styled.label`
  font-size: 14px;
  color: #6b7280;
  min-width: 100px;
`;

export const CurrencyInput = styled.div`
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;

  span {
    padding: 8px 10px;
    background: #f9fafb;
    color: #6b7280;
    font-size: 14px;
    border-right: 1px solid #d1d5db;
  }

  input {
    border: none;
    outline: none;
    padding: 8px 10px;
    font-size: 14px;
    width: 120px;
    color: #1a1a2e;
  }
`;

export const ScheduleTabs = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  margin-top: 8px;
`;

export const ScheduleTab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 14px 16px;
  border-radius: 10px;
  border: 2px solid ${(p) => (p.$active ? '#5B1647' : '#e5e7eb')};
  background: ${(p) => (p.$active ? '#5B1647' : '#fff')};
  color: ${(p) => (p.$active ? '#fff' : '#374151')};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${(p) => (p.$active ? '#5B1647' : '#9ca3af')};
  }
`;

export const TabTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const TabSubtext = styled.span`
  font-size: 11px;
  opacity: 0.75;
`;

export const TrancheCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 12px;
  overflow: hidden;
`;

export const TrancheHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
`;

export const TrancheAmount = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const RemoveTrancheBtn = styled.button`
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;

  &:hover {
    background: #fee2e2;
    color: #dc2626;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const TrancheBody = styled.div`
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const TrancheFieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const TrancheLabel = styled.label`
  font-size: 13px;
  color: #6b7280;
  min-width: 70px;
`;

export const SmallInput = styled.input`
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 13px;
  width: 70px;
  outline: none;
  color: #1a1a2e;

  &:focus {
    border-color: #5B1647;
  }
`;

export const UnitLabel = styled.span`
  font-size: 13px;
  color: #9ca3af;
`;

export const DropdownWrapper = styled.div`
  flex: 1;
  position: relative;
`;

export const DropdownTrigger = styled.button<{ $open?: boolean; $disabled?: boolean }>`
  width: 100%;
  padding: 7px 32px 7px 10px;
  font-size: 13px;
  color: ${(p) => (p.$disabled ? '#9ca3af' : '#1a1a2e')};
  border: 1px solid ${(p) => (p.$open ? '#5b1647' : '#d1d5db')};
  border-radius: 6px;
  outline: none;
  font-family: inherit;
  background: ${(p) => (p.$disabled ? '#f9fafb' : '#fff')};
  cursor: ${(p) => (p.$disabled ? 'default' : 'pointer')};
  text-align: left;
  position: relative;
  box-shadow: ${(p) => (p.$open ? '0 0 0 2px rgba(91, 22, 71, 0.1)' : 'none')};

  &:hover {
    border-color: ${(p) => (p.$disabled ? '#d1d5db' : p.$open ? '#5b1647' : '#9ca3af')};
  }

  svg {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%) ${(p) => (p.$open ? 'rotate(180deg)' : 'rotate(0)')};
    width: 14px;
    height: 14px;
    color: #6b7280;
    transition: transform 0.15s ease;
  }
`;

export const DropdownMenu = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px 0;
  margin: 0;
  list-style: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
`;

export const DropdownItem = styled.li<{ $active?: boolean }>`
  padding: 8px 12px;
  font-size: 13px;
  color: ${(p) => (p.$active ? '#5b1647' : '#1a1a2e')};
  background: ${(p) => (p.$active ? '#fdf2f8' : 'transparent')};
  font-weight: ${(p) => (p.$active ? '500' : '400')};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;

  &:hover {
    background: ${(p) => (p.$active ? '#fdf2f8' : '#f3f4f6')};
  }

  svg {
    width: 14px;
    height: 14px;
    color: #5b1647;
    flex-shrink: 0;
  }
`;

export const AddTrancheBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
  border: none;
  background: none;
  color: #5B1647;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 4px;

  &:hover {
    text-decoration: underline;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const AllocationBar = styled.div<{ $valid: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  margin-top: 4px;
  background: ${(p) => (p.$valid ? '#f0fdf4' : '#fef2f2')};
  color: ${(p) => (p.$valid ? '#16a34a' : '#dc2626')};
`;

export const RecurringConfig = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #374151;
  flex-wrap: wrap;
`;

export const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
`;

export const PrimaryButton = styled.button`
  padding: 10px 28px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: #5B1647;
  color: #fff;

  &:hover {
    background: #4a1239;
  }

  &:disabled {
    background: #e5e7eb;
    color: #9ca3af;
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled.button`
  padding: 10px 28px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: #374151;

  &:hover {
    background: #f3f4f6;
  }
`;

export const ScheduleHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  h3 {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
    margin: 0;
  }
`;

export const PaymentCount = styled.span`
  font-size: 12px;
  color: #9ca3af;
`;

export const DateInput = styled.input`
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 7px 10px;
  font-size: 13px;
  outline: none;
  color: #1a1a2e;

  &:focus {
    border-color: #5B1647;
  }
`;
