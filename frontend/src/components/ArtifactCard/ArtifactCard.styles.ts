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

export const ExplainPanel = styled.div`
  padding: 16px;
  background: #fffbeb;
  border-top: 1px solid #fde68a;
  font-size: 13px;
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

export const ExplainLoading = styled.div`
  padding: 16px;
  background: #fffbeb;
  border-top: 1px solid #fde68a;
  text-align: center;
  color: #92400e;
  font-size: 13px;
`;

export const SummaryBar = styled.div`
  padding: 10px 14px;
  background: #fef3c7;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: #92400e;

  span { display: block; color: #b45309; font-size: 12px; margin-top: 4px; }
`;

export const TierRow = styled.div`
  display: flex;
  gap: 8px;
`;

export const TierCard = styled.div<{ $active?: boolean }>`
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  text-align: center;
  border: 2px solid ${(p) => (p.$active ? '#d97706' : '#fde68a')};
  background: ${(p) => (p.$active ? '#fef3c7' : '#fffbeb')};
  box-shadow: ${(p) => (p.$active ? '0 0 0 1px #d97706' : 'none')};
`;

export const TierLabel = styled.div`
  font-size: 11px;
  color: #92400e;
  margin-bottom: 4px;
`;

export const TierRate = styled.div<{ $active?: boolean }>`
  font-size: 20px;
  font-weight: 700;
  color: ${(p) => (p.$active ? '#92400e' : '#b45309')};
`;

export const ExampleHeader = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #92400e;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const DealList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const DealItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #fde68a;
  border-radius: 6px;
  font-size: 12px;

  span:first-child { color: #6b7280; font-family: monospace; }
  span:nth-child(2) { font-weight: 600; color: #1a1a2e; }
  span:last-child { color: #6b7280; }
`;

export const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  background: #1e1e2e;
  border-radius: 8px;
  padding: 12px 14px;
`;

export const StepRow = styled.div<{ $final?: boolean }>`
  display: grid;
  grid-template-columns: 100px 1fr 120px;
  gap: 8px;
  padding: 4px 0;
  color: ${(p) => (p.$final ? '#a6e3a1' : '#cdd6f4')};
  border-top: ${(p) => (p.$final ? '1px solid #45475a' : 'none')};
  margin-top: ${(p) => (p.$final ? '4px' : '0')};
  padding-top: ${(p) => (p.$final ? '8px' : '4px')};
  font-weight: ${(p) => (p.$final ? '700' : '400')};
`;

export const StepLabel = styled.span`
  color: #89b4fa;
`;

export const StepFormula = styled.span`
  color: #6c7086;
`;

export const StepResult = styled.span`
  text-align: right;
`;

export const StepNote = styled.span`
  color: #6c7086;
  font-size: 11px;
`;

export const ProgressBarContainer = styled.div`
  height: 6px;
  background: #313244;
  border-radius: 3px;
  margin-top: 4px;
  overflow: hidden;
`;

export const ProgressBarFill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => Math.min(p.$pct, 100)}%;
  background: ${(p) => (p.$pct >= 100 ? '#a6e3a1' : p.$pct >= 80 ? '#f9e2af' : '#f38ba8')};
  border-radius: 3px;
  transition: width 0.4s ease;
`;

export const ResultCallout = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #065f46;
  border-radius: 8px;
  color: #ecfdf5;

  span:first-child { font-size: 13px; }
  span:last-child { font-size: 22px; font-weight: 700; }
`;
