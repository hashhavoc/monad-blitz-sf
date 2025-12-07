export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    name: string;
    args: any;
    result?: any;
  }>;
}

