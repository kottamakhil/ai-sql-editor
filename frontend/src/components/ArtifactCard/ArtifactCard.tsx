import { useState } from 'react';
import { useExecuteArtifact, useUpdateArtifact } from '../../actions/plans';
import type { ArtifactCardProps } from './ArtifactCard.types';
import {
  Card,
  Header,
  ArtifactName,
  HeaderActions,
  IconBtn,
  SqlEditor,
  SqlFooter,
  SaveStatus,
  SaveBtn,
  DataSection,
  DataTable,
  RowCount,
  ErrorBox,
  LoadingBox,
} from './ArtifactCard.styles';

export function ArtifactCard({ artifact, planId, cycleId }: ArtifactCardProps) {
  const [view, setView] = useState<'data' | 'sql'>('data');
  const [collapsed, setCollapsed] = useState(false);
  const [editedSql, setEditedSql] = useState(artifact.sql_expression);
  const { data: result, isLoading, isError } = useExecuteArtifact(artifact.artifact_id, cycleId);
  const updateMutation = useUpdateArtifact(planId);

  const hasChanges = editedSql !== artifact.sql_expression;

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
          <IconBtn title={collapsed ? 'Expand' : 'Collapse'} onClick={() => setCollapsed((c) => !c)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: collapsed ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s ease' }}>
              <polyline points="18 15 12 9 6 15" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconBtn>
        </HeaderActions>
      </Header>

      {!collapsed && view === 'sql' && (
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

      {!collapsed && view === 'data' && (
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
