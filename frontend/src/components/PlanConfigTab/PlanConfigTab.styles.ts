import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const EditorHeader = styled.div`
  padding: 16px 24px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const HeaderTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0;
`;

export const JsonEditor = styled.textarea`
  flex: 1;
  margin: 0 24px;
  padding: 16px;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  border: none;
  border-radius: 8px;
  outline: none;
  resize: none;
  box-sizing: border-box;
  tab-size: 2;
  overflow-x: auto;
  white-space: pre;
`;

export const SaveFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-top: 1px solid #e5e7eb;
`;

export const SaveStatus = styled.span<{ $type: 'info' | 'success' | 'error' }>`
  font-size: 12px;
  color: ${(p) =>
    p.$type === 'success' ? '#16a34a' :
    p.$type === 'error' ? '#dc2626' :
    '#6b7280'};
`;

export const SaveBtn = styled.button<{ $disabled: boolean }>`
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  background: ${(p) => (p.$disabled ? '#d1d5db' : '#5b1647')};
  color: ${(p) => (p.$disabled ? '#9ca3af' : '#fff')};
  font-size: 13px;
  font-weight: 500;
  cursor: ${(p) => (p.$disabled ? 'default' : 'pointer')};
  font-family: inherit;

  &:hover {
    background: ${(p) => (p.$disabled ? '#d1d5db' : '#4a1239')};
  }
`;
