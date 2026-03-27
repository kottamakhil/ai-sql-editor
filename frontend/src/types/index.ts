export interface PlanSkill {
  skill_id: string;
  skill_name: string;
  version_id: string;
  version: number;
  content: string;
}

export interface Plan {
  plan_id: string;
  name: string;
  plan_type: string;
  frequency: string;
  mode: string;
  artifacts: Artifact[];
  skills?: PlanSkill[] | null;
}

export interface PlanCreate {
  name: string;
  plan_type?: string;
  frequency?: string;
}

export interface PlanUpdate {
  name?: string | null;
  plan_type?: string | null;
  frequency?: string | null;
}

export interface Artifact {
  artifact_id: string;
  name: string | null;
  sql_expression: string;
}

export interface ArtifactCreate {
  name?: string | null;
  sql_expression: string;
}

export interface Skill {
  skill_id: string;
  name: string;
  content: string;
}

export interface Message {
  message_id: string;
  role: string;
  content: string;
}

export interface Conversation {
  conversation_id: string;
  plan_id: string;
  title: string | null;
  messages: Message[];
}

export interface ConversationSummary {
  conversation_id: string;
  plan_id: string;
  title: string | null;
  message_count: number;
}

export interface ExecutionResult {
  columns: string[];
  rows: unknown[][];
  row_count: number;
  error?: string | null;
}

export interface ClarificationOption {
  value: string;
  label: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  options: ClarificationOption[];
  allow_multiple?: boolean;
  allow_freetext?: boolean;
}

export interface ToolCallOut {
  tool_name: string;
  arguments: Record<string, unknown>;
  result: unknown;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
  skills?: string[];
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  composed_sql: string | null;
  tool_calls: ToolCallOut[];
  current_artifacts: Artifact[];
  plan: Plan | null;
  iterations: number;
  pending_questions: ClarificationQuestion[] | null;
}

export interface PreviewResponse {
  composed_sql: string;
  result: ExecutionResult;
}

export interface SchemaResponse {
  tables: string[];
}
