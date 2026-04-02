import { useState, useMemo } from 'react';
import { useExecuteArtifact } from '../../actions/plans';
import { highlightSQL } from '../../utils/highlightSQL';
import { artifactDisplayName, sortArtifacts } from '../../utils/artifactLabels';
import type { Artifact } from '../../types';
import {
  Overlay,
  Modal,
  Header,
  TopRow,
  PlanName,
  NavGroup,
  NavBtn,
  Counter,
  CloseBtn,
  ArtifactName,
  Toolbar,
  FilterInput,
  ViewToggle,
  ViewToggleBtn,
  Body,
  DataTable,
  SqlView,
  Footer,
  DataLoading,
  DataError,
} from './ArtifactTakeover.styles';

interface ArtifactTakeoverProps {
  planName: string;
  artifacts: Artifact[];
  initialArtifactName?: string;
  onClose: () => void;
}

function ArtifactDataBody({ artifact, filter }: { artifact: Artifact; filter: string }) {
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
      <Footer>
        <span>{filteredRows.length} of {data.row_count} row{data.row_count !== 1 ? 's' : ''}</span>
        <span>{data.columns.length} column{data.columns.length !== 1 ? 's' : ''}</span>
      </Footer>
    </>
  );
}

export function ArtifactTakeover({ planName, artifacts: rawArtifacts, initialArtifactName, onClose }: ArtifactTakeoverProps) {
  const sorted = useMemo(() => sortArtifacts(rawArtifacts.filter((a) => a.name && a.sql_expression)), [rawArtifacts]);

  const initialIdx = initialArtifactName
    ? Math.max(0, sorted.findIndex((a) => a.name === initialArtifactName))
    : 0;

  const [idx, setIdx] = useState(initialIdx);
  const [viewMode, setViewMode] = useState<'table' | 'sql'>('table');
  const [filterText, setFilterText] = useState('');

  const artifact = sorted[idx];
  if (!artifact) return null;

  const nav = (dir: -1 | 1) => {
    setIdx((i) => i + dir);
    setViewMode('table');
    setFilterText('');
  };

  return (
    <Overlay onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Modal>
        <Header>
          <TopRow>
            <PlanName>{planName}</PlanName>
            <NavGroup>
              <NavBtn disabled={idx === 0} onClick={() => nav(-1)} title="Previous">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </NavBtn>
              <Counter>{idx + 1}/{sorted.length}</Counter>
              <NavBtn disabled={idx >= sorted.length - 1} onClick={() => nav(1)} title="Next">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </NavBtn>
              <CloseBtn onClick={onClose} title="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </CloseBtn>
            </NavGroup>
          </TopRow>
          <ArtifactName>{artifactDisplayName(artifact.name ?? '')}</ArtifactName>
        </Header>

        <Toolbar>
          <FilterInput
            placeholder="Filter rows..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          <ViewToggle>
            <ViewToggleBtn $active={viewMode === 'table'} onClick={() => setViewMode('table')} title="Table view">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </ViewToggleBtn>
            <ViewToggleBtn $active={viewMode === 'sql'} onClick={() => setViewMode('sql')} title="SQL view">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="8 6 2 12 8 18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </ViewToggleBtn>
          </ViewToggle>
        </Toolbar>

        <Body>
          {viewMode === 'sql' ? (
            <SqlView>{highlightSQL(artifact.sql_expression)}</SqlView>
          ) : (
            <ArtifactDataBody artifact={artifact} filter={filterText} />
          )}
        </Body>
      </Modal>
    </Overlay>
  );
}
