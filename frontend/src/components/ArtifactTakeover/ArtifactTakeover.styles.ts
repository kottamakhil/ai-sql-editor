import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const Modal = styled.div`
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

export const Header = styled.div`
  padding: 16px 24px 12px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const PlanName = styled.span`
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
`;

export const NavGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const NavBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: none;
  color: #9ca3af;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    color: #1a1a2e;
  }

  &:disabled {
    opacity: 0.25;
    cursor: default;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const Counter = styled.span`
  font-size: 12px;
  color: #6b7280;
  min-width: 24px;
  text-align: center;
`;

export const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: none;
  color: #6b7280;
  cursor: pointer;
  margin-left: 8px;

  &:hover {
    background: #f3f4f6;
    color: #1a1a2e;
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

export const ArtifactName = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 24px;
  border-bottom: 1px solid #e5e7eb;
`;

export const FilterInput = styled.input`
  padding: 6px 12px;
  font-size: 13px;
  font-family: inherit;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  outline: none;
  color: #1a1a2e;
  width: 200px;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #5b1647;
    box-shadow: 0 0 0 2px rgba(91, 22, 71, 0.1);
  }
`;

export const ViewToggle = styled.div`
  display: flex;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
`;

export const ViewToggleBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 28px;
  border: none;
  background: ${(p) => (p.$active ? '#f3f4f6' : '#fff')};
  color: ${(p) => (p.$active ? '#1a1a2e' : '#9ca3af')};
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    color: #1a1a2e;
  }

  & + & {
    border-left: 1px solid #e5e7eb;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const Body = styled.div`
  flex: 1;
  overflow: auto;
  padding: 20px;
`;

export const DataTable = styled.table<{ $noBorder?: boolean }>`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  border: ${(p) => (p.$noBorder === false ? '1px solid #e5e7eb' : 'none')};
  border-radius: ${(p) => (p.$noBorder === false ? '8px' : '0')};
  overflow: hidden;

  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
    white-space: nowrap;
  }

  th {
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6b7280;
    background: #f9fafb;
    position: sticky;
    top: 0;
  }

  td {
    color: #374151;
  }
`;

export const SqlView = styled.pre`
  margin: 0;
  padding: 20px;
  font-size: 13px;
  line-height: 1.6;
  font-family: 'Fira Code', 'Consolas', monospace;
  background: #1e1e1e;
  color: #d4d4d4;
  min-height: 200px;
  overflow: auto;
  white-space: pre;
  border-radius: 8px;
`;

export const Footer = styled.div`
  padding: 10px 24px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ErrorBanner = styled.div`
  padding: 12px 20px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
`;

export const DataLoading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #9ca3af;
  font-size: 14px;
`;

export const DataError = styled.div`
  padding: 16px 20px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 13px;
  border-radius: 8px;
`;

/* Legacy exports kept for ChatPanel's composed SQL takeover */
export const Title = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
  font-family: 'Fira Code', 'Consolas', monospace;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;
