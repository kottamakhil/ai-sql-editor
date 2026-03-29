import type { Artifact, PlanCycle } from '../../types';

export interface ArtifactsTabProps {
  artifacts: Artifact[];
  planId: string;
  cycles?: PlanCycle[] | null;
}
