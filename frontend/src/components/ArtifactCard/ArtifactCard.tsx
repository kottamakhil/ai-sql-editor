import { useState } from 'react';
import { useExecuteArtifact, useUpdateArtifact, explainArtifact } from '../../actions/plans';
import type { ExplainData } from '../../actions/plans';
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
  ExplainPanel,
  ExplainLoading,
  SummaryBar,
  TierRow,
  TierCard,
  TierLabel,
  TierRate,
  ExampleHeader,
  DealList,
  DealItem,
  StepList,
  StepRow,
  StepLabel,
  StepFormula,
  StepResult,
  StepNote,
  ProgressBarContainer,
  ProgressBarFill,
  ResultCallout,
} from './ArtifactCard.styles';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

export function ArtifactCard({ artifact, planId, cycleId }: ArtifactCardProps) {
  const [view, setView] = useState<'data' | 'sql'>('data');
  const [collapsed, setCollapsed] = useState(false);
  const [editedSql, setEditedSql] = useState(artifact.sql_expression);
  const [showExplain, setShowExplain] = useState(false);
  const [explainData, setExplainData] = useState<ExplainData | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
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

  const handleExplain = async () => {
    if (showExplain && explainData) {
      setShowExplain(false);
      return;
    }
    setShowExplain(true);
    setExplainLoading(true);
    try {
      const resp = await explainArtifact(artifact.artifact_id, cycleId);
      setExplainData(resp);
    } catch {
      setExplainData(null);
    } finally {
      setExplainLoading(false);
    }
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

  const finalStep = explainData?.example.steps.find((s) => s.is_final);

  return (
    <Card>
      <Header>
        <ArtifactName>{artifact.name || 'Unnamed artifact'}</ArtifactName>
        <HeaderActions>
          {artifact.name === 'payout' && (
            <IconBtn title="Explain this artifact" $active={showExplain} onClick={handleExplain}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </IconBtn>
          )}
          <IconBtn title="View data" $active={view === 'data' && !showExplain} onClick={() => { setView('data'); setShowExplain(false); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </IconBtn>
          <IconBtn title={`Edit SQL${hasChanges ? ' (unsaved)' : ''}`} $active={view === 'sql'} onClick={() => { setView('sql'); setShowExplain(false); }}>
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

      {!collapsed && showExplain && (
        <>
          {explainLoading && <ExplainLoading>Generating explanation...</ExplainLoading>}
          {!explainLoading && explainData && (
            <ExplainPanel>
              <SummaryBar>
                {explainData.summary}
                <span>{explainData.eligibility}</span>
              </SummaryBar>

              {explainData.tiers.length > 0 && (
                <TierRow>
                  {explainData.tiers.map((tier) => (
                    <TierCard key={tier.label} $active={tier.is_active}>
                      <TierLabel>{tier.label}</TierLabel>
                      <TierRate $active={tier.is_active}>{tier.rate}</TierRate>
                    </TierCard>
                  ))}
                </TierRow>
              )}

              <ExampleHeader>Example: {explainData.example.employee}, {explainData.example.period}</ExampleHeader>

              <DealList>
                {explainData.example.deals.map((deal) => (
                  <DealItem key={deal.id}>
                    <span>{deal.id}</span>
                    <span>{formatCurrency(deal.value)}</span>
                    <span>{deal.date}</span>
                  </DealItem>
                ))}
              </DealList>

              <StepList>
                {explainData.example.steps.map((step, i) => (
                  <div key={i}>
                    <StepRow $final={step.is_final}>
                      <StepLabel>{step.label}</StepLabel>
                      <StepFormula>{step.formula || ''}</StepFormula>
                      <StepResult>{step.result}{step.note ? <StepNote> ({step.note})</StepNote> : null}</StepResult>
                    </StepRow>
                    {step.bar_pct != null && (
                      <ProgressBarContainer>
                        <ProgressBarFill $pct={step.bar_pct} />
                      </ProgressBarContainer>
                    )}
                  </div>
                ))}
              </StepList>

              {finalStep && (
                <ResultCallout>
                  <span>Commission</span>
                  <span>{finalStep.result}</span>
                </ResultCallout>
              )}
            </ExplainPanel>
          )}
          {!explainLoading && !explainData && (
            <ExplainLoading>Failed to generate explanation.</ExplainLoading>
          )}
        </>
      )}

      {!collapsed && !showExplain && view === 'sql' && (
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

      {!collapsed && !showExplain && view === 'data' && (
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
