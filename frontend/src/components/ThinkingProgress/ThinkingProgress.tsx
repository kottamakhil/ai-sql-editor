import { useState, useEffect } from 'react';
import type { ThinkingProgressProps } from './ThinkingProgress.types';
import type { StreamArtifactEvent } from '../../types';
import { artifactDisplayName } from '../../utils/artifactLabels';
import {
  ProgressContainer,
  CollapsedSummary,
  StepList,
  StepRow,
  StepIcon,
  Spinner,
  StepContent,
  StepLabel,
  StepMeta,
  ArtifactPreviewList,
  ArtifactChip,
  ArtifactChipHeader,
  ArtifactName,
  ExpandBtn,
} from './ThinkingProgress.styles';

const TOOL_LABELS: Record<string, string> = {
  create_plan: 'Creating plan',
  update_plan: 'Updating plan details',
  update_plan_config: 'Configuring plan settings',
  update_sql_artifacts: 'Building SQL artifacts',
  execute_query: 'Running query',
  validate_sql: 'Validating SQL',
  infer_plan_config: 'Analyzing plan configuration',
  ask_clarification: 'Preparing clarification questions',
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InlineArtifactPreview({
  artifact,
  onExpand,
}: {
  artifact: StreamArtifactEvent;
  onExpand: (artifact: StreamArtifactEvent) => void;
}) {
  return (
    <ArtifactChip $hasError={artifact.status === 'error'} onClick={() => onExpand(artifact)} style={{ cursor: 'pointer' }}>
      <ArtifactChipHeader>
        <ArtifactName>{artifactDisplayName(artifact.name)}</ArtifactName>
        <ExpandBtn as="span" title="Open full view">&#x2197;</ExpandBtn>
      </ArtifactChipHeader>
    </ArtifactChip>
  );
}

function ElapsedTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);
  return <StepMeta>{formatDuration(now - startedAt)}</StepMeta>;
}

export function ThinkingProgress({
  steps,
  isComplete,
  totalDurationMs,
  onExpandArtifact,
}: ThinkingProgressProps & { onExpandArtifact?: (a: StreamArtifactEvent) => void }) {
  const [collapsed, setCollapsed] = useState(false);

  const hasArtifacts = steps.some((s) => s.artifacts.length > 0);

  useEffect(() => {
    if (isComplete && !hasArtifacts) {
      const timer = setTimeout(() => setCollapsed(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isComplete, hasArtifacts]);

  if (steps.length === 0) {
    return (
      <ProgressContainer>
        <StepRow $status="running">
          <StepIcon $status="running"><Spinner /></StepIcon>
          <StepLabel>Thinking...</StepLabel>
        </StepRow>
      </ProgressContainer>
    );
  }

  if (isComplete && collapsed) {
    return (
      <ProgressContainer>
        <CollapsedSummary
          data-expanded="false"
          onClick={() => setCollapsed(false)}
        >
          <ChevronIcon />
          Thinking completed in {totalDurationMs ? formatDuration(totalDurationMs) : '—'}
          ({steps.length} step{steps.length !== 1 ? 's' : ''})
        </CollapsedSummary>
      </ProgressContainer>
    );
  }

  return (
    <ProgressContainer>
      {isComplete && (
        <CollapsedSummary
          data-expanded="true"
          onClick={() => setCollapsed(true)}
        >
          <ChevronIcon />
          Thinking completed in {totalDurationMs ? formatDuration(totalDurationMs) : '—'}
          ({steps.length} step{steps.length !== 1 ? 's' : ''})
        </CollapsedSummary>
      )}
      <StepList>
        {steps.map((step, i) => (
          <div key={i}>
            <StepRow $status={step.status}>
              <StepIcon $status={step.status}>
                {step.status === 'running' ? (
                  <Spinner />
                ) : step.status === 'error' ? (
                  <ErrorIcon />
                ) : (
                  <CheckIcon />
                )}
              </StepIcon>
              <StepContent>
                <StepLabel>
                  {step.label}
                  {step.status === 'running' && <ElapsedTimer startedAt={step.startedAt} />}
                  {step.status !== 'running' && step.durationMs != null && (
                    <StepMeta>{formatDuration(step.durationMs)}</StepMeta>
                  )}
                </StepLabel>
                {step.artifacts.length > 0 && (
                  <ArtifactPreviewList>
                    {step.artifacts.map((a) => (
                      <InlineArtifactPreview
                        key={a.name}
                        artifact={a}
                        onExpand={onExpandArtifact ?? (() => {})}
                      />
                    ))}
                  </ArtifactPreviewList>
                )}
              </StepContent>
            </StepRow>
          </div>
        ))}
      </StepList>
    </ProgressContainer>
  );
}
