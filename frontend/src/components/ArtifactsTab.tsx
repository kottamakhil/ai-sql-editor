import styled from 'styled-components';
import type { Artifact } from '../types';
import { ArtifactCard } from './ArtifactCard';

const Container = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
  font-size: 14px;
`;

interface ArtifactsTabProps {
  artifacts: Artifact[];
}

export function ArtifactsTab({ artifacts }: ArtifactsTabProps) {
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
      {artifacts.map((artifact) => (
        <ArtifactCard key={artifact.artifact_id} artifact={artifact} />
      ))}
    </Container>
  );
}
