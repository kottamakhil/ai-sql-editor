import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Plan,
  PlanCreate,
  PlanUpdate,
  PlanConfig,
  PlanMembership,
  ChatRequest,
  ChatResponse,
  ChatFileOut,
  Artifact,
  ArtifactCreate,
  PreviewResponse,
  SchemaResponse,
  ExecutionResult,
  Skill,
  PlanTemplate,
  Conversation,
  ConversationSummary,
  LineageDAG,
  Employee,
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

export const updatePlanConfig = (planId: string, data: Partial<PlanConfig>) =>
  http<PlanConfig>(`/plans/${planId}/config`, { method: 'PATCH', body: JSON.stringify(data) });

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

export async function uploadChatFile(file: File): Promise<ChatFileOut> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/chat/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}

// ---- Execute ----

export const executeSql = (data: { artifact_id?: string; sql_expression?: string; cycle_id?: string }) =>
  http<ExecutionResult>('/execute', { method: 'POST', body: JSON.stringify(data) });

// ---- Explain ----

export interface ExplainData {
  artifact_id: string;
  artifact_name: string | null;
  html_content: string;
}

export const explainArtifact = (artifactId: string, cycleId?: string) =>
  http<ExplainData>(
    `/artifacts/${artifactId}/explain`,
    { method: 'POST', body: JSON.stringify({ cycle_id: cycleId }) },
  );

// ---- Preview ----

export const fetchPreview = (planId: string, cycleId?: string) => {
  const params = cycleId ? `?cycle_id=${cycleId}` : '';
  return http<PreviewResponse>(`/plans/${planId}/preview${params}`);
};

// ---- Lineage ----

export const fetchPlanLineage = (planId: string) =>
  http<LineageDAG>(`/plans/${planId}/lineage`);

// ---- Skills ----

export const fetchSkills = () => http<Skill[]>('/skills');

export const createSkill = (data: { name: string; content: string }) =>
  http<Skill>('/skills', { method: 'POST', body: JSON.stringify(data) });

export const updateSkill = (skillId: string, data: { name: string; content: string }) =>
  http<Skill>(`/skills/${skillId}`, { method: 'PUT', body: JSON.stringify(data) });

// ---- Plan Templates ----

export const fetchPlanTemplates = () => http<PlanTemplate[]>('/plan-templates');

export const fetchPlanTemplate = (templateId: string) =>
  http<PlanTemplate>(`/plan-templates/${templateId}`);

export const createPlanTemplate = (data: { name: string; content: string }) =>
  http<PlanTemplate>('/plan-templates', { method: 'POST', body: JSON.stringify(data) });

export const updatePlanTemplate = (templateId: string, data: { name: string; content: string }) =>
  http<PlanTemplate>(`/plan-templates/${templateId}`, { method: 'PUT', body: JSON.stringify(data) });

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

export const useUpdatePlan = (planId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PlanUpdate) => updatePlan(planId, data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['plan', planId] });
      const previous = qc.getQueryData<Plan>(['plan', planId]);
      if (previous) {
        const patch: Partial<Plan> = {};
        if (data.name != null) patch.name = data.name;
        if (data.plan_type != null) patch.plan_type = data.plan_type;
        if (data.frequency != null) patch.frequency = data.frequency;
        qc.setQueryData<Plan>(['plan', planId], { ...previous, ...patch });
      }
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        qc.setQueryData(['plan', planId], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['plan', planId] });
      qc.invalidateQueries({ queryKey: ['plans'] });
    },
  });
};

export const useUpdatePlanConfig = (planId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PlanConfig>) => updatePlanConfig(planId, data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['plan', planId] });
      const previous = qc.getQueryData<Plan>(['plan', planId]);
      if (previous) {
        const merged: PlanConfig = {
          payout: { ...previous.config.payout, ...data.payout },
          payroll: { ...previous.config.payroll, ...data.payroll },
          disputes: { ...previous.config.disputes, ...data.disputes },
        };
        qc.setQueryData<Plan>(['plan', planId], { ...previous, config: merged });
      }
      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        qc.setQueryData(['plan', planId], context.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['plan', planId] });
    },
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

export const useUpdateSkill = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, data }: { skillId: string; data: { name: string; content: string } }) =>
      updateSkill(skillId, data),
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

export const useExecuteArtifact = (artifactId: string, cycleId?: string) =>
  useQuery({
    queryKey: ['execute', artifactId, cycleId],
    queryFn: () => executeSql({ artifact_id: artifactId, cycle_id: cycleId }),
    enabled: !!artifactId,
  });

export const usePlanLineage = (planId: string) =>
  useQuery({
    queryKey: ['lineage', planId],
    queryFn: () => fetchPlanLineage(planId),
    enabled: !!planId,
  });

export const usePlanTemplates = () =>
  useQuery({ queryKey: ['plan-templates'], queryFn: fetchPlanTemplates });

export const useCreatePlanTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPlanTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan-templates'] }),
  });
};

export const useUpdatePlanTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: { name: string; content: string } }) =>
      updatePlanTemplate(templateId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan-templates'] }),
  });
};

// ---- Membership Rules ----

export interface FieldValues {
  department: string[];
  role: string[];
  country: string[];
}

export const fetchEmployeeFieldValues = () =>
  http<FieldValues>('/employees/field-values');

export const fetchMembership = (planId: string) =>
  http<PlanMembership>(`/plans/${planId}/membership`);

export const updateMembership = (planId: string, data: PlanMembership) =>
  http<PlanMembership>(`/plans/${planId}/membership`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const fetchPlanMembers = (planId: string) =>
  http<Employee[]>(`/plans/${planId}/members`);

export const useEmployeeFieldValues = () =>
  useQuery({ queryKey: ['employee-field-values'], queryFn: fetchEmployeeFieldValues });

export const useUpdateMembership = (planId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PlanMembership) => updateMembership(planId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan', planId] });
      qc.invalidateQueries({ queryKey: ['plan-members', planId] });
    },
  });
};

export const usePlanMembers = (planId: string, enabled = true) =>
  useQuery({
    queryKey: ['plan-members', planId],
    queryFn: () => fetchPlanMembers(planId),
    enabled: !!planId && enabled,
  });
