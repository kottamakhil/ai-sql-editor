import styled from 'styled-components';

export const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

export const ArtifactName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

export const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

export const IconBtn = styled.button<{ $active?: boolean }>`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: ${(p) => (p.$active ? '#e5e7eb' : 'none')};
  color: ${(p) => (p.$active ? '#1a1a2e' : '#6b7280')};
  cursor: pointer;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const SqlEditor = styled.textarea`
  margin: 0;
  padding: 16px;
  background: #1e1e2e;
  color: #cdd6f4;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  width: 100%;
  min-height: 160px;
  border: none;
  outline: none;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    box-shadow: inset 0 0 0 2px rgba(91, 22, 71, 0.4);
  }
`;

export const SqlFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #1e1e2e;
  border-top: 1px solid #313244;
`;

export const SaveStatus = styled.span<{ $type: 'info' | 'success' | 'error' }>`
  font-size: 12px;
  color: ${(p) =>
    p.$type === 'success' ? '#a6e3a1' :
    p.$type === 'error' ? '#f38ba8' :
    '#6c7086'};
`;

export const SaveBtn = styled.button<{ $disabled: boolean }>`
  padding: 5px 14px;
  border: none;
  border-radius: 6px;
  background: ${(p) => (p.$disabled ? '#45475a' : '#5b1647')};
  color: ${(p) => (p.$disabled ? '#6c7086' : '#fff')};
  font-size: 12px;
  font-weight: 500;
  cursor: ${(p) => (p.$disabled ? 'default' : 'pointer')};
  font-family: inherit;

  &:hover {
    background: ${(p) => (p.$disabled ? '#45475a' : '#4a1239')};
  }
`;

export const DataSection = styled.div`
  overflow-x: auto;
`;

export const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th {
    text-align: left;
    padding: 10px 12px;
    background: #f9fafb;
    color: #374151;
    font-weight: 600;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
  }

  td {
    padding: 8px 12px;
    color: #1a1a2e;
    border-bottom: 1px solid #f3f4f6;
    white-space: nowrap;
  }

  tr:hover td {
    background: #f9fafb;
  }
`;

export const RowCount = styled.div`
  padding: 8px 12px;
  font-size: 12px;
  color: #6b7280;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
`;

export const ErrorBox = styled.div`
  padding: 12px 16px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
`;

export const LoadingBox = styled.div`
  padding: 16px;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
`;

export const ExplainLoading = styled.div`
  padding: 16px;
  background: #fffbeb;
  border-top: 1px solid #fde68a;
  text-align: center;
  color: #92400e;
  font-size: 13px;
`;

export const ExplainHtml = styled.div`
  border-top: 1px solid #fde68a;
  background: #fffbeb;

  .explain-root {
    padding: 16px;
    font-size: 13px;
    color: #374151;
    line-height: 1.5;
  }
`;
