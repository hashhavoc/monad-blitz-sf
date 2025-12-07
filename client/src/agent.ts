import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { createBroadcastTool } from "./tools/broadcastTool";

const PROXY_URL = (import.meta.env?.VITE_PROXY_URL as string) || "http://localhost:3000";

/**
 * Creates and configures the LangChain React agent using Anthropic Claude
 */
export async function createMeshtasticAgent(
  fetchWithPayment: (url: string, options?: RequestInit) => Promise<any>
) {
  // Initialize the Anthropic Claude model
  const model = new ChatAnthropic({
    model: (import.meta.env?.VITE_ANTHROPIC_MODEL as string) || "claude-sonnet-4-5-20250929",
    temperature: 0.7,
    anthropicApiKey: import.meta.env?.VITE_ANTHROPIC_API_KEY as string,
  });

  // Create the broadcast tool
  const broadcastTool = createBroadcastTool(fetchWithPayment);

  // System prompt for the agent
  const systemPrompt = `You are a helpful assistant that helps users broadcast messages over the Meshtastic network.

Key Information:
- The broadcast endpoint is: ${PROXY_URL}/broadcast
- Each broadcast costs $0.01 (paid automatically via x402)
- Messages are broadcast to all nodes in the mesh network by default
- Users can optionally specify a destination node ID for targeted messages

Instructions:
1. When a user wants to send a message, use the broadcast_meshtastic_message tool
2. IMPORTANT: Messages must be 100 characters or less. If the user's message exceeds 100 characters, you must shorten it or ask them to provide a shorter message
3. Always confirm when messages are sent successfully
4. If there's an error, explain it clearly to the user
5. Be friendly, helpful, and concise
6. If the user doesn't specify a destination, use null for destinationId to broadcast to all nodes

Remember: The payment is handled automatically, so you don't need to worry about payment details. Just use the tool when the user wants to send a message.`;

  // Create the React agent
  const agent = createReactAgent({
    llm: model,
    tools: [broadcastTool],
  });

  // Store the system prompt to be used when invoking the agent
  (agent as any).systemPrompt = systemPrompt;

  return agent;
}

