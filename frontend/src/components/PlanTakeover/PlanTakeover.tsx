import { useMemo, useState } from 'react';
import { useExecuteArtifact } from '../../actions/plans';
import type { Artifact, Plan } from '../../types';
import { artifactDisplayName, sortArtifacts } from '../../utils/artifactLabels';
import { highlightSQL } from '../../utils/highlightSQL';
import {
  TakeoverOverlay,
  TakeoverModal,
  TakeoverHeader,
  TakeoverTopRow,
  TakeoverPlanName,
  TakeoverNavGroup,
  TakeoverArtifactName,
  TakeoverCounter,
  NavBtn,
  TakeoverToolbar,
  FilterInput,
  TakeoverBody,
  TakeoverCloseBtn,
  TakeoverConfigEditor,
  ViewToggle,
  ViewToggleBtn,
  DataTable,
  DataLoading,
  DataError,
  DataFooter,
  Table,
  Row,
  LabelCell,
  ValueCell,
} from '../SummaryTab/SummaryTab.styles';

function formatBool(val: boolean): string {
  return val ? 'Yes' : 'No';
}

function formatValue(val: string | number | null | undefined): string {
  if (val == null) return '—';
  return String(val);
}

function composeSql(plan: Plan): string {
  const arts = sortArtifacts(plan.artifacts.filter((a) => a.name && a.sql_expression));
  if (arts.length === 0) return '-- No SQL artifacts defined yet.';
  return arts.map((a) => `-- ${a.name}\n${a.sql_expression}`).join('\n\n');
}

function ArtifactDataView({ artifact, filter }: { artifact: Artifact; filter: string }) {
  const { data, isLoading, isError, error } = useExecuteArtifact(artifact.artifact_id);

  if (isLoading) return <DataLoading>Loading data...</DataLoading>;
  if (isError) return <DataError>{(error as Error)?.message || 'Failed to execute query'}</DataError>;
  if (!data || data.columns.length === 0) return <DataLoading>No data returned</DataLoading>;

  const lowerFilter = filter.toLowerCase();
  const filteredRows = lowerFilter
    ? data.rows.filter((row) => row.some((cell) => String(cell ?? '').toLowerCase().includes(lowerFilter)))
    : data.rows;

  return (
    <>
      <DataTable $noBorder>
        <thead>
          <tr>
            {data.columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell == null ? '—' : String(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </DataTable>
      <DataFooter>{filteredRows.length} of {data.row_count} row{data.row_count !== 1 ? 's' : ''}</DataFooter>
    </>
  );
}

export function PlanTakeover({
  plan,
  onClose,
  initialArtifactName,
  initialViewMode,
}: {
  plan: Plan;
  onClose: () => void;
  initialArtifactName?: string;
  initialViewMode?: 'table' | 'config';
}) {
  const artifacts = useMemo(
    () => sortArtifacts(plan.artifacts.filter((a) => a.name && a.sql_expression)),
    [plan.artifacts],
  );
  const initialIdx = useMemo(() => {
    if (!initialArtifactName) return 0;
    const ix = artifacts.findIndex((a) => a.name === initialArtifactName);
    return ix >= 0 ? ix + 1 : 0;
  }, [artifacts, initialArtifactName]);

  const [takeoverIdx, setTakeoverIdx] = useState(initialIdx);
  const [viewMode, setViewMode] = useState<'table' | 'config'>(initialViewMode ?? 'table');
  const [filterText, setFilterText] = useState('');

  const totalPages = 1 + artifacts.length;
  const isPlanDetails = takeoverIdx === 0;
  const currentArtifact = isPlanDetails ? null : artifacts[takeoverIdx - 1];
  const takeoverLabel = isPlanDetails ? 'Plan details' : artifactDisplayName(currentArtifact?.name ?? '');
  const { payout, payroll, disputes } = plan.config;

  return (
    <TakeoverOverlay onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <TakeoverModal>
        <TakeoverHeader>
          <TakeoverTopRow>
            <TakeoverPlanName>{plan.name}</TakeoverPlanName>
            <TakeoverNavGroup>
              <NavBtn disabled={takeoverIdx === 0} onClick={() => { setTakeoverIdx((i) => i - 1); setViewMode('table'); setFilterText(''); }} title="Previous">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </NavBtn>
              <TakeoverCounter>{takeoverIdx + 1}/{totalPages}</TakeoverCounter>
              <NavBtn disabled={takeoverIdx >= totalPages - 1} onClick={() => { setTakeoverIdx((i) => i + 1); setViewMode('table'); setFilterText(''); }} title="Next">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </NavBtn>
              <TakeoverCloseBtn onClick={onClose} title="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </TakeoverCloseBtn>
            </TakeoverNavGroup>
          </TakeoverTopRow>
          <TakeoverArtifactName>{takeoverLabel}</TakeoverArtifactName>
        </TakeoverHeader>
        <TakeoverToolbar>
          <FilterInput placeholder="Filter rows..." value={filterText} onChange={(e) => setFilterText(e.target.value)} />
          <ViewToggle>
            <ViewToggleBtn $active={viewMode === 'table'} onClick={() => setViewMode('table')} title="Table view">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </ViewToggleBtn>
            <ViewToggleBtn $active={viewMode === 'config'} onClick={() => setViewMode('config')} title="SQL view">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="8 6 2 12 8 18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </ViewToggleBtn>
          </ViewToggle>
        </TakeoverToolbar>
        <TakeoverBody>
          {viewMode === 'config' ? (
            <TakeoverConfigEditor>
              {highlightSQL(isPlanDetails ? composeSql(plan) : currentArtifact!.sql_expression)}
            </TakeoverConfigEditor>
          ) : isPlanDetails ? (
            <Table $noBorder>
              <Row><LabelCell>Plan name</LabelCell><ValueCell>{plan.name}</ValueCell></Row>
              <Row><LabelCell>Type</LabelCell><ValueCell>{plan.plan_type}</ValueCell></Row>
              <Row><LabelCell>Frequency</LabelCell><ValueCell>{plan.frequency}</ValueCell></Row>
              <Row><LabelCell>Automatic payout</LabelCell><ValueCell>{formatBool(payout.is_automatic_payout_enabled)}</ValueCell></Row>
              <Row><LabelCell>Final payment offset</LabelCell><ValueCell>{formatValue(payout.final_payment_offset)}</ValueCell></Row>
              <Row><LabelCell>Draws enabled</LabelCell><ValueCell>{formatBool(payout.is_draws_enabled)}</ValueCell></Row>
              <Row><LabelCell>Draw frequency</LabelCell><ValueCell>{formatValue(payout.draw_frequency)}</ValueCell></Row>
              <Row><LabelCell>Payout type</LabelCell><ValueCell>{formatValue(payroll.payout_type)}</ValueCell></Row>
              <Row><LabelCell>Disputes enabled</LabelCell><ValueCell>{formatBool(disputes.is_disputes_enabled)}</ValueCell></Row>
            </Table>
          ) : (
            <ArtifactDataView artifact={currentArtifact!} filter={filterText} />
          )}
        </TakeoverBody>
      </TakeoverModal>
    </TakeoverOverlay>
  );
}
