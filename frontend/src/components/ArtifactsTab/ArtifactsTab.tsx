import { useState } from 'react';
import { ArtifactCard } from '../ArtifactCard/ArtifactCard';
import type { ArtifactsTabProps } from './ArtifactsTab.types';
import { Container, EmptyState } from './ArtifactsTab.styles';
import styled from 'styled-components';

const PeriodBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  margin-bottom: 8px;
`;

const PeriodLabel = styled.span`
  font-size: 13px;
  color: #888;
`;

const PeriodSelect = styled.select`
  padding: 6px 10px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #1a1a2e;
  color: #e0e0e0;
  font-size: 13px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #6c63ff;
  }
`;

export function ArtifactsTab({ artifacts, planId, cycles }: ArtifactsTabProps) {
  const hasCycles = cycles && cycles.length > 0;
  const defaultCycleId = hasCycles ? cycles[cycles.length - 1].cycle_id : undefined;
  const [selectedCycleId, setSelectedCycleId] = useState<string | undefined>(defaultCycleId);

  if (artifacts.length === 0) {
    return (
      <Container>
        <EmptyState>
          No artifacts yet. Use the chat to generate SQL artifacts for this plan.
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      {hasCycles && (
        <PeriodBar>
          <PeriodLabel>Period:</PeriodLabel>
          <PeriodSelect
            value={selectedCycleId || ''}
            onChange={(e) => setSelectedCycleId(e.target.value || undefined)}
          >
            {cycles.map((c) => (
              <option key={c.cycle_id} value={c.cycle_id}>
                {c.period_name}
              </option>
            ))}
            <option value="">All Periods</option>
          </PeriodSelect>
        </PeriodBar>
      )}
      {artifacts.map((artifact) => (
        <ArtifactCard
          key={artifact.artifact_id}
          artifact={artifact}
          planId={planId}
          cycleId={selectedCycleId}
        />
      ))}
    </Container>
  );
}
