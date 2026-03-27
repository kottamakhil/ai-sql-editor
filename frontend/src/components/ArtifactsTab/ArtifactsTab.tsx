import { ArtifactCard } from '../ArtifactCard/ArtifactCard';
import type { ArtifactsTabProps } from './ArtifactsTab.types';
import { Container, EmptyState } from './ArtifactsTab.styles';

export function ArtifactsTab({ artifacts, planId }: ArtifactsTabProps) {
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
        <ArtifactCard key={artifact.artifact_id} artifact={artifact} planId={planId} />
      ))}
    </Container>
  );
}
