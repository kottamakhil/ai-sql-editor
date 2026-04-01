import styled from 'styled-components';

export const Card = styled.div`
  border: none;
  border-radius: 8px;
  overflow: hidden;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 12px;
  background: transparent;
  border-bottom: none;
`;

export const ArtifactName = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #1a1a2e;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
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
  background: ${(p) => (p.$active ? '#f3f4f6' : 'none')};
  color: ${(p) => (p.$active ? '#1a1a2e' : '#9ca3af')};
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
    color: #1a1a2e;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const ToggleGroup = styled.div`
  display: flex;
  align-items: center;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 2px;
  gap: 2px;
`;

export const ToggleBtn = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  border: none;
  border-radius: 999px;
  background: ${(p) => (p.$active ? '#fff' : 'transparent')};
  box-shadow: ${(p) => (p.$active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none')};
  color: ${(p) => (p.$active ? '#1a1a2e' : '#9ca3af')};
  cursor: pointer;
  transition: all 0.15s ease;

  svg {
    width: 16px;
    height: 16px;
  }
`;

export const SqlEditorWrapper = styled.div`
  position: relative;
  min-height: 160px;
  background: #1e1e1e;
`;

export const SqlEditorHighlight = styled.pre`
  margin: 0;
  padding: 16px;
  background: transparent;
  color: #d4d4d4;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: hidden;
  pointer-events: none;
  box-sizing: border-box;
`;

export const SqlEditorTextarea = styled.textarea`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 16px;
  background: transparent;
  color: transparent;
  caret-color: #d4d4d4;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  border: none;
  outline: none;
  resize: none;
  box-sizing: border-box;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: hidden;

  &:focus {
    box-shadow: inset 0 0 0 2px rgba(91, 22, 71, 0.4);
  }

  &::selection {
    background: rgba(38, 79, 120, 0.6);
    color: transparent;
  }
`;

export const SqlFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #1e1e1e;
  border-top: 1px solid #333;
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

export const DataTable = styled.table<{ $noBorder?: boolean }>`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  border: ${(p) => (p.$noBorder === false ? '1px solid #e5e7eb' : 'none')};
  border-radius: ${(p) => (p.$noBorder === false ? '8px' : '0')};
  overflow: hidden;

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
  border-top: none;
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
