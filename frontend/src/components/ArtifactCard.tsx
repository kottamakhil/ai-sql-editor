import { useState } from 'react';
import styled from 'styled-components';
import type { Artifact } from '../types';
import { useExecuteArtifact, useUpdateArtifact } from '../actions/plans';

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

const IconBtn = styled.button<{ $active?: boolean }>`
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

const SqlEditor = styled.textarea`
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

const SqlFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #1e1e2e;
  border-top: 1px solid #313244;
`;

const SaveStatus = styled.span<{ $type: 'info' | 'success' | 'error' }>`
  font-size: 12px;
  color: ${(p) =>
    p.$type === 'success' ? '#a6e3a1' :
    p.$type === 'error' ? '#f38ba8' :
    '#6c7086'};
`;

const SaveBtn = styled.button<{ $disabled: boolean }>`
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
  planId: string;
}

export function ArtifactCard({ artifact, planId }: ArtifactCardProps) {
  const [view, setView] = useState<'data' | 'sql'>('data');
  const [editedSql, setEditedSql] = useState(artifact.sql_expression);
  const { data: result, isLoading, isError } = useExecuteArtifact(artifact.artifact_id);
  const updateMutation = useUpdateArtifact(planId);

  const hasChanges = editedSql !== artifact.sql_expression;

  const handleCopy = () => {
    navigator.clipboard.writeText(editedSql);
  };

  const handleSave = () => {
    if (!hasChanges || updateMutation.isPending) return;
    updateMutation.mutate({
      artifactId: artifact.artifact_id,
      data: { sql_expression: editedSql },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Card>
      <Header>
        <ArtifactName>{artifact.name || 'Unnamed artifact'}</ArtifactName>
        <HeaderActions>
          <IconBtn title="View data" $active={view === 'data'} onClick={() => setView('data')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </IconBtn>
          <IconBtn title={`Edit SQL${hasChanges ? ' (unsaved)' : ''}`} $active={view === 'sql'} onClick={() => setView('sql')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </IconBtn>
        </HeaderActions>
      </Header>

      {view === 'sql' && (
        <>
          <SqlEditor
            value={editedSql}
            onChange={(e) => setEditedSql(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
          />
          <SqlFooter>
            <SaveStatus
              $type={
                updateMutation.isSuccess ? 'success' :
                updateMutation.isError ? 'error' :
                'info'
              }
            >
              {updateMutation.isPending ? 'Saving...' :
               updateMutation.isSuccess ? 'Saved' :
               updateMutation.isError ? 'Save failed' :
               hasChanges ? 'Unsaved changes' : 'Cmd+Enter or Cmd+S to save'}
            </SaveStatus>
            <SaveBtn $disabled={!hasChanges || updateMutation.isPending} onClick={handleSave}>
              Save
            </SaveBtn>
          </SqlFooter>
        </>
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
