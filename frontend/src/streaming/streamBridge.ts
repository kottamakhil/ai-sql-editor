import { useSyncExternalStore } from 'react';
import { streamChat } from '../actions/plans';
import type { StreamEvent, StreamArtifactEvent, ChatResponse } from '../types';
import type { ThinkingStep } from '../components/ThinkingProgress/ThinkingProgress.types';

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

export interface BridgeMessage {
  role: string;
  content: string;
}

export interface BridgeSnapshot {
  steps: ThinkingStep[];
  isStreaming: boolean;
  thinkingComplete: boolean;
  thinkingTotalMs: number | undefined;
  planId: string | null;
  conversationId: string | null;
  response: ChatResponse | null;
  error: string | null;
  messages: BridgeMessage[];
}

const EMPTY: BridgeSnapshot = {
  steps: [],
  isStreaming: false,
  thinkingComplete: false,
  thinkingTotalMs: undefined,
  planId: null,
  conversationId: null,
  response: null,
  error: null,
  messages: [],
};

let snapshot: BridgeSnapshot = EMPTY;
let startTime = 0;
let abortCtrl: AbortController | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

function handleEvent(event: StreamEvent) {
  const prev = snapshot;
  const steps = prev.steps.map((s) => ({ ...s }));

  switch (event.type) {
    case 'tool_start': {
      const tool = event.tool ?? 'unknown';
      steps.push({
        tool,
        label: TOOL_LABELS[tool] ?? tool,
        status: 'running',
        startedAt: Date.now(),
        artifacts: [],
      });
      snapshot = { ...prev, steps };
      break;
    }
    case 'tool_complete': {
      const last = steps.findLast(
        (s) => s.tool === event.tool && s.status === 'running',
      );
      if (last) {
        last.status = event.success ? 'complete' : 'error';
        last.durationMs = event.duration_ms;
      }
      const planId = event.plan_id ?? prev.planId;
      snapshot = { ...prev, steps, planId };
      break;
    }
    case 'artifact': {
      const artifactStep = steps.findLast(
        (s) => s.tool === 'update_sql_artifacts',
      );
      if (artifactStep) {
        artifactStep.artifacts = [
          ...artifactStep.artifacts,
          event as StreamArtifactEvent,
        ];
      }
      snapshot = { ...prev, steps };
      break;
    }
    case 'complete': {
      const res = event.data as ChatResponse;
      snapshot = {
        ...prev,
        steps,
        conversationId: res.conversation_id,
        response: res,
        thinkingComplete: true,
        thinkingTotalMs: Date.now() - startTime,
        isStreaming: false,
        planId: res.plan?.plan_id ?? prev.planId,
      };
      break;
    }
    case 'error': {
      snapshot = {
        ...prev,
        steps,
        error: event.error,
        isStreaming: false,
        thinkingComplete: true,
      };
      break;
    }
    default:
      return;
  }

  emit();
}

export function bridgeStart(
  request: {
    message: string;
    conversation_id: string | null;
    skill_ids?: string[];
    file_ids?: string[];
  },
  messages?: BridgeMessage[],
): AbortController {
  snapshot = { ...EMPTY, isStreaming: true, messages: messages ?? [] };
  startTime = Date.now();
  abortCtrl = streamChat(request, handleEvent);
  emit();
  return abortCtrl;
}

export function bridgeClear() {
  snapshot = EMPTY;
  abortCtrl = null;
  emit();
}

export function bridgeAbort() {
  abortCtrl?.abort();
}

export function useBridge(): BridgeSnapshot {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => snapshot,
  );
}
