import styled from 'styled-components';

export const StepperContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 0 24px;
`;

export const StepItem = styled.div<{ $active: boolean; $completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: ${(p) => (p.$active ? 600 : 400)};
  color: ${(p) =>
    p.$active ? '#5B1647' : p.$completed ? '#16a34a' : '#9ca3af'};
  cursor: default;
  white-space: nowrap;
`;

export const StepNumber = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  background: ${(p) =>
    p.$completed ? '#16a34a' : p.$active ? '#5B1647' : '#e5e7eb'};
  color: ${(p) =>
    p.$completed || p.$active ? '#fff' : '#9ca3af'};
`;

export const StepConnector = styled.div<{ $completed: boolean }>`
  width: 40px;
  height: 2px;
  background: ${(p) => (p.$completed ? '#16a34a' : '#e5e7eb')};
  flex-shrink: 0;
`;
