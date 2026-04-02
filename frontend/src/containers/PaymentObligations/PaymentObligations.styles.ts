import styled from 'styled-components';

export const PageContainer = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 32px;
`;

export const PageHeader = styled.div`
  margin-bottom: 28px;

  h1 {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0;
  }

  p {
    font-size: 14px;
    color: #6b7280;
    margin: 6px 0 0;
  }
`;

export const SummaryRow = styled.div`
  display: flex;
  gap: 1px;
  background: #e5e7eb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 28px;
`;

export const SummaryCard = styled.div<{ $accent?: string }>`
  flex: 1;
  background: #fff;
  padding: 20px 24px;

  .value {
    font-size: 24px;
    font-weight: 700;
    color: ${(p) => p.$accent ?? '#1a1a2e'};
  }

  .label {
    font-size: 13px;
    color: #9ca3af;
    margin-top: 4px;
  }
`;

export const TableWrapper = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
`;

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.2fr 1fr 1.2fr 1fr 1fr;
  padding: 12px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
`;

export const EmployeeRow = styled.div<{ $expanded?: boolean }>`
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
`;

export const EmployeeHeader = styled.button<{ $expanded?: boolean }>`
  width: 100%;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  align-items: center;
  padding: 16px 20px;
  border: none;
  background: ${(p) => (p.$expanded ? '#fafafa' : '#fff')};
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.1s ease;

  &:hover {
    background: #f9fafb;
  }
`;

export const EmployeeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const ExpandIcon = styled.span<{ $expanded?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #9ca3af;
  transition: transform 0.15s ease;
  transform: rotate(${(p) => (p.$expanded ? '90deg' : '0deg')});
  flex-shrink: 0;

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const EmployeeAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const EmployeeNameBlock = styled.div`
  .name {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
  }

  .detail {
    font-size: 12px;
    color: #9ca3af;
    margin-top: 1px;
  }
`;

export const StatCell = styled.div`
  font-size: 13px;
  color: #6b7280;
`;

export const PayoutRows = styled.div`
  background: #fafafa;
`;

export const PayoutRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.2fr 1fr 1.2fr 1fr 1fr;
  padding: 10px 20px 10px 62px;
  font-size: 13px;
  color: #374151;
  border-top: 1px solid #f0f0f0;
  align-items: center;
`;

export const PayoutType = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;

  .installment {
    font-size: 11px;
    font-weight: 500;
    color: #6b7280;
    background: #e5e7eb;
    padding: 1px 7px;
    border-radius: 10px;
  }
`;

export const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => (p.$status === 'paid' ? '#16a34a' : '#ea580c')};
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 60px 24px;
  color: #9ca3af;
  font-size: 15px;
`;

export const LoadingState = styled.div`
  text-align: center;
  padding: 60px 24px;
  color: #9ca3af;
  font-size: 14px;
`;
