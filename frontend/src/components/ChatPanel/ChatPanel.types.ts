export interface DisplayMessage {
  role: string;
  content: string;
  _showSqlChip?: boolean;
}

export interface ChatPanelProps {
  planId: string;
}
