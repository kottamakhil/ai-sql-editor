import type { StreamStepEvent, StreamArtifactEvent } from '../../types';

export interface ThinkingStep {
  tool: string;
  label: string;
  status: 'running' | 'complete' | 'error';
  startedAt: number;
  durationMs?: number;
  artifacts: StreamArtifactEvent[];
}

export interface ThinkingProgressProps {
  steps: ThinkingStep[];
  isComplete: boolean;
  totalDurationMs?: number;
}
