import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const ProgressContainer = styled.div`
  align-self: flex-start;
  width: 100%;
  border-radius: 10px;
  font-size: 13px;
  color: #1a1a1a;
`;

export const CollapsedSummary = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #6b7280;
  width: 100%;
  text-align: left;
  font-family: inherit;

  &:hover {
    background: #ebebeb;
  }

  svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    transition: transform 0.15s;
  }

  &[data-expanded='true'] svg {
    transform: rotate(90deg);
  }
`;

export const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StepRow = styled.div<{ $status: string }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  opacity: ${(p) => (p.$status === 'complete' ? 0.7 : 1)};
`;

export const StepIcon = styled.div<{ $status: string }>`
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid #e5e7eb;
  border-top-color: #5b1647;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;

export const StepContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const StepLabel = styled.div`
  font-size: 13px;
  line-height: 1.4;
  color: #374151;
`;

export const StepMeta = styled.span`
  font-size: 11px;
  color: #9ca3af;
  margin-left: 6px;
`;

export const ArtifactPreviewList = styled.div`
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const ArtifactChip = styled.div<{ $hasError?: boolean }>`
  display: inline-flex;
  align-items: center;
  border: 1px solid ${(p) => (p.$hasError ? '#fca5a5' : '#e5e7eb')};
  border-radius: 6px;
  background: ${(p) => (p.$hasError ? '#fef2f2' : '#fff')};
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }
`;

export const ArtifactChipHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
`;

export const ArtifactName = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  font-family: 'Fira Code', 'Consolas', monospace;
  white-space: nowrap;
`;

export const ArtifactBadge = styled.span<{ $error?: boolean }>`
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: ${(p) => (p.$error ? '#fee2e2' : '#ecfdf5')};
  color: ${(p) => (p.$error ? '#b91c1c' : '#065f46')};
`;

export const ToggleGroup = styled.div`
  display: flex;
  gap: 2px;
  margin-left: 8px;
`;

export const ToggleBtn = styled.button<{ $active: boolean }>`
  padding: 2px 8px;
  font-size: 10px;
  font-family: inherit;
  border: 1px solid ${(p) => (p.$active ? '#5b1647' : '#d1d5db')};
  background: ${(p) => (p.$active ? '#5b1647' : '#fff')};
  color: ${(p) => (p.$active ? '#fff' : '#6b7280')};
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: ${(p) => (p.$active ? '#4a1239' : '#f3f4f6')};
  }
`;

export const ArtifactBody = styled.div`
  border-top: 1px solid #e5e7eb;
  max-height: 200px;
  overflow: auto;
`;

export const MiniTable = styled.table<{ $noBorder?: boolean }>`
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  border: ${(p) => (p.$noBorder === false ? '1px solid #e5e7eb' : 'none')};
  border-radius: ${(p) => (p.$noBorder === false ? '8px' : '0')};
  overflow: hidden;

  th, td {
    padding: 4px 8px;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
    white-space: nowrap;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  th {
    font-weight: 600;
    color: #6b7280;
    background: #f9fafb;
    position: sticky;
    top: 0;
  }

  td {
    color: #374151;
  }
`;

export const TruncatedNote = styled.div`
  padding: 4px 8px;
  font-size: 10px;
  color: #9ca3af;
  text-align: center;
`;

export const SqlBlock = styled.pre`
  margin: 0;
  padding: 8px 10px;
  font-size: 11px;
  line-height: 1.6;
  font-family: 'Fira Code', 'Consolas', monospace;
  background: #1e1e1e;
  color: #d4d4d4;
  overflow-x: auto;
  white-space: pre;
  border-radius: 8px;
`;

export const ExpandBtn = styled.button`
  padding: 0;
  font-size: 12px;
  font-family: inherit;
  border: none;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
`;

export const ErrorText = styled.div`
  padding: 6px 10px;
  font-size: 11px;
  color: #b91c1c;
`;
