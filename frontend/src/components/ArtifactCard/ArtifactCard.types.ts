import type { Artifact } from '../../types';

export interface ArtifactCardProps {
  artifact: Artifact;
  planId: string;
  cycleId?: string;
  onExpand?: (artifactName: string) => void;
}
