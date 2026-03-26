import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Plan,
  PlanCreate,
  PlanUpdate,
  ChatRequest,
  ChatResponse,
  Artifact,
  ArtifactCreate,
  PreviewResponse,
  SchemaResponse,
  ExecutionResult,
  Skill,
  Conversation,
  ConversationSummary,
} from '../types';

const BASE = '/api';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Plans ----

export const fetchPlans = () =>
  http<Plan[]>('/plans');

export const fetchPlan = (planId: string) =>
  http<Plan>(`/plans/${planId}`);

export const createPlan = (data: PlanCreate) =>
  http<Plan>('/plans', { method: 'POST', body: JSON.stringify(data) });

export const updatePlan = (planId: string, data: PlanUpdate) =>
  http<Plan>(`/plans/${planId}`, { method: 'PATCH', body: JSON.stringify(data) });

// ---- Artifacts ----

export const createArtifact = (planId: string, data: ArtifactCreate) =>
  http<Artifact>(`/plans/${planId}/artifacts`, { method: 'POST', body: JSON.stringify(data) });

export const updateArtifact = (artifactId: string, data: Partial<ArtifactCreate>) =>
  http<Artifact>(`/artifacts/${artifactId}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteArtifact = (artifactId: string) =>
  http<void>(`/artifacts/${artifactId}`, { method: 'DELETE' });

// ---- Chat ----

export const sendChat = (data: ChatRequest) =>
  http<ChatResponse>('/chat', { method: 'POST', body: JSON.stringify(data) });

// ---- Execute ----

export const executeSql = (data: { artifact_id?: string; sql_expression?: string }) =>
  http<ExecutionResult>('/execute', { method: 'POST', body: JSON.stringify(data) });

// ---- Preview ----

export const fetchPreview = (planId: string) =>
  http<PreviewResponse>(`/plans/${planId}/preview`);

// ---- Skills ----

export const fetchSkills = () => http<Skill[]>('/skills');

export const createSkill = (data: { name: string; content: string }) =>
  http<Skill>('/skills', { method: 'POST', body: JSON.stringify(data) });

// ---- Schema ----

export const fetchSchema = () => http<SchemaResponse>('/schema');

// ---- Conversations ----

export const fetchConversations = (planId: string) =>
  http<ConversationSummary[]>(`/plans/${planId}/conversations`);

export const fetchConversation = (conversationId: string) =>
  http<Conversation>(`/conversations/${conversationId}`);

export const deleteConversation = (conversationId: string) =>
  http<void>(`/conversations/${conversationId}`, { method: 'DELETE' });

// ---- React Query hooks ----

export const usePlans = () =>
  useQuery({ queryKey: ['plans'], queryFn: fetchPlans });

export const usePlan = (planId: string) =>
  useQuery({ queryKey: ['plan', planId], queryFn: () => fetchPlan(planId), enabled: !!planId });

export const useCreatePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPlan,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });
};

export const useUpdateArtifact = (planId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ artifactId, data }: { artifactId: string; data: Partial<ArtifactCreate> }) =>
      updateArtifact(artifactId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', planId] });
      qc.invalidateQueries({ queryKey: ['execute'] });
    },
  });
};

export const useChat = () =>
  useMutation({ mutationFn: sendChat });

export const useSkills = () =>
  useQuery({ queryKey: ['skills'], queryFn: fetchSkills });

export const useCreateSkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSkill,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['skills'] }),
  });
};

export const useSchema = () =>
  useQuery({ queryKey: ['schema'], queryFn: fetchSchema });

export const useConversations = (planId: string) =>
  useQuery({
    queryKey: ['conversations', planId],
    queryFn: () => fetchConversations(planId),
    enabled: !!planId,
  });

export const useConversation = (conversationId: string | null) =>
  useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => fetchConversation(conversationId!),
    enabled: !!conversationId,
  });

export const useExecuteArtifact = (artifactId: string) =>
  useQuery({
    queryKey: ['execute', artifactId],
    queryFn: () => executeSql({ artifact_id: artifactId }),
    enabled: !!artifactId,
  });
