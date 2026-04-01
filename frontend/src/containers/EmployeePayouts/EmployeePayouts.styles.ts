import styled from 'styled-components';

export const PageContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 32px;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
`;

export const Avatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  flex-shrink: 0;

  svg {
    width: 28px;
    height: 28px;
  }
`;

export const HeaderInfo = styled.div`
  h1 {
    font-size: 22px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
  }

  p {
    font-size: 14px;
    color: #6b7280;
    margin: 4px 0 0;
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

export const SummaryCard = styled.div`
  flex: 1;
  background: #fff;
  padding: 20px 24px;

  .value {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a2e;
  }

  .label {
    font-size: 13px;
    color: #9ca3af;
    margin-top: 4px;
  }
`;

export const TabBar = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

export const Tab = styled.button<{ $active: boolean }>`
  padding: 6px 16px;
  border-radius: 20px;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${(p) => (p.$active ? '#1a1a2e' : '#f3f4f6')};
  color: ${(p) => (p.$active ? '#fff' : '#6b7280')};

  &:hover {
    background: ${(p) => (p.$active ? '#1a1a2e' : '#e5e7eb')};
  }
`;

export const PayoutsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const PayoutCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px 24px;
  position: relative;
`;

export const PayoutCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 4px;
`;

export const PayoutName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  .name {
    font-size: 15px;
    font-weight: 600;
    color: #1a1a2e;
  }

  .installment {
    font-size: 11px;
    font-weight: 500;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 10px;
  }
`;

export const PayoutAmount = styled.div`
  text-align: right;

  .amount {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a2e;
  }
`;

export const StatusBadge = styled.span<{ $status: 'paid' | 'scheduled' }>`
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => (p.$status === 'paid' ? '#16a34a' : '#ea580c')};
`;

export const PayoutDate = styled.div`
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 8px;
`;

export const StatusDot = styled.span<{ $status: 'paid' | 'scheduled' }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  position: absolute;
  left: -5px;
  top: 24px;
  background: ${(p) => (p.$status === 'paid' ? '#16a34a' : '#ea580c')};
`;

export const GroupSection = styled.div`
  margin-bottom: 32px;
`;

export const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  .group-name {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .group-total {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
  }
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
