import styled from 'styled-components';

export const PageContainer = styled.div`
  display: flex;
  height: 100%;
  overflow: hidden;
`;

export const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const Breadcrumb = styled.div`
  padding: 12px 24px;
  font-size: 13px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 20px;
`;

export const PlanName = styled.span`
  color: #1a1a2e;
  font-weight: 500;
`;

export const StatusDot = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #6b7280;
  font-size: 12px;

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f59e0b;
  }
`;

export const TabBar = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  padding: 0 24px;
`;

export const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 500;
  color: ${(p) => (p.$active ? '#1a1a2e' : '#6b7280')};
  cursor: pointer;
  border-bottom: 2px solid ${(p) => (p.$active ? '#5b1647' : 'transparent')};
  margin-bottom: -1px;

  &:hover {
    color: #1a1a2e;
  }
`;

export const TabContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

export const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  font-size: 14px;
`;

export const ErrorState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #dc2626;
  font-size: 14px;
`;
