export interface Plan {
  plan_id: string;
  name: string;
  plan_type: string;
  frequency: string;
  mode: string;
  artifacts: Artifact[];
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

export interface OperationResult {
  action: string;
  artifact_id?: string | null;
  name?: string | null;
  sql_expression?: string | null;
  result?: ExecutionResult | null;
}

export interface ChatRequest {
  plan_id: string;
  message: string;
  conversation_id?: string | null;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  operations: OperationResult[];
  current_artifacts: Artifact[];
  conversation_history: Array<{ role: string; content: string }>;
}

export interface PreviewResponse {
  composed_sql: string;
  result: ExecutionResult;
}

export interface SchemaResponse {
  tables: string[];
}
