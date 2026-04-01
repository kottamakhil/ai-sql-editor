export interface PlanSkill {
  skill_id: string;
  skill_name: string;
  version_id: string;
  version: number;
  content: string;
}

export interface PayoutConfig {
  is_automatic_payout_enabled: boolean;
  final_payment_offset: number | null;
  is_draws_enabled: boolean;
  draw_frequency: string | null;
}

export interface PayrollConfig {
  payout_type: string | null;
}

export interface DisputeConfig {
  is_disputes_enabled: boolean;
}

export interface PlanConfig {
  payout: PayoutConfig;
  payroll: PayrollConfig;
  disputes: DisputeConfig;
}

export interface PlanCycle {
  cycle_id: string;
  period_name: string;
  start_date: string;
  end_date: string;
}

export interface Plan {
  plan_id: string;
  name: string;
  plan_type: string;
  frequency: string;
  mode: string;
  start_date?: string | null;
  end_date?: string | null;
  artifacts: Artifact[];
  cycles?: PlanCycle[] | null;
  config: PlanConfig;
  inferred_config?: string | null;
  skills?: PlanSkill[] | null;
  membership?: PlanMembership | null;
}

export interface MembershipRule {
  field: string;
  values: string[];
}

export interface PlanMembership {
  match_type: 'all' | 'any';
  rules: MembershipRule[];
  exceptions: MembershipRule[];
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

export interface ChatFileOut {
  file_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
  skill_ids?: string[];
  file_ids?: string[];
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

export interface LineageNode {
  id: string;
  name: string | null;
  sql: string;
  type: string;
}

export interface LineageEdge {
  source: string;
  target: string;
}

export interface LineageDAG {
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface PreviewResponse {
  composed_sql: string;
  result: ExecutionResult;
}

export interface SchemaResponse {
  tables: string[];
}

export interface PlanTemplate {
  template_id: string;
  name: string;
  content: string;
}

export interface Employee {
  employee_id: string;
  name: string;
  department: string;
  role: string;
  country: string;
  start_date: string;
}

export interface PayoutItem {
  payout_id: string;
  employee_id: string;
  group_id: string;
  amount: number;
  date: string;
  status: 'paid' | 'scheduled';
}

export interface PayoutGroup {
  payouts: PayoutItem[];
  total: number;
}

export interface EmployeePayouts {
  employee_id: string;
  groups: Record<string, PayoutGroup>;
}

// --- SSE streaming events ---

export interface StreamStepEvent {
  type: 'tool_start' | 'tool_complete' | 'iteration';
  tool?: string;
  arguments_summary?: string;
  success?: boolean;
  duration_ms?: number;
  result_summary?: string;
  plan_id?: string;
}

export interface StreamArtifactEvent {
  type: 'artifact';
  name: string;
  sql: string;
  columns: string[];
  rows: unknown[][];
  row_count: number;
  status: 'success' | 'error';
  error?: string | null;
}

export interface StreamCompleteEvent {
  type: 'complete';
  data: ChatResponse;
}

export interface StreamErrorEvent {
  type: 'error';
  error: string;
}

export type StreamEvent = StreamStepEvent | StreamArtifactEvent | StreamCompleteEvent | StreamErrorEvent;
