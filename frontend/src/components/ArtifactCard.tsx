import { useState } from 'react';
import styled from 'styled-components';
import type { Artifact } from '../types';
import { useExecuteArtifact } from '../actions/plans';

const Card = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
`;

const ArtifactName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #374151;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 8px;
`;

const IconBtn = styled.button`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 6px;
  background: none;
  color: #6b7280;
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

const ToggleRow = styled.div`
  display: flex;
  border-bottom: 1px solid #e5e7eb;
`;

const ToggleBtn = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px;
  border: none;
  background: ${(p) => (p.$active ? '#fff' : '#f9fafb')};
  color: ${(p) => (p.$active ? '#1a1a2e' : '#6b7280')};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: ${(p) => (p.$active ? '2px solid #5b1647' : '2px solid transparent')};

  &:hover {
    background: #fff;
  }
`;

const SqlBlock = styled.pre`
  margin: 0;
  padding: 16px;
  background: #1e1e2e;
  color: #cdd6f4;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
`;

const DataSection = styled.div`
  overflow-x: auto;
`;

const DataTable = styled.table`
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

const RowCount = styled.div`
  padding: 8px 12px;
  font-size: 12px;
  color: #6b7280;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
`;

const ErrorBox = styled.div`
  padding: 12px 16px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
`;

const LoadingBox = styled.div`
  padding: 16px;
  text-align: center;
  color: #6b7280;
  font-size: 13px;
`;

interface ArtifactCardProps {
  artifact: Artifact;
}

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  const [view, setView] = useState<'data' | 'sql'>('data');
  const { data: result, isLoading, isError } = useExecuteArtifact(artifact.artifact_id);

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.sql_expression);
  };

  return (
    <Card>
      <Header>
        <ArtifactName>{artifact.name || 'Unnamed artifact'}</ArtifactName>
        <HeaderActions>
          <IconBtn title="Copy SQL" onClick={handleCopy}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </IconBtn>
        </HeaderActions>
      </Header>

      <ToggleRow>
        <ToggleBtn $active={view === 'data'} onClick={() => setView('data')}>Data</ToggleBtn>
        <ToggleBtn $active={view === 'sql'} onClick={() => setView('sql')}>SQL</ToggleBtn>
      </ToggleRow>

      {view === 'sql' && (
        <SqlBlock>{artifact.sql_expression}</SqlBlock>
      )}

      {view === 'data' && (
        <>
          {isLoading && <LoadingBox>Executing query...</LoadingBox>}
          {isError && <ErrorBox>Failed to execute artifact.</ErrorBox>}
          {result && result.error && <ErrorBox>{result.error}</ErrorBox>}
          {result && !result.error && (
            <DataSection>
              <DataTable>
                <thead>
                  <tr>
                    {result.columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j}>{cell == null ? '—' : String(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </DataTable>
              <RowCount>{result.row_count} row{result.row_count !== 1 ? 's' : ''}</RowCount>
            </DataSection>
          )}
        </>
      )}
    </Card>
  );
}
