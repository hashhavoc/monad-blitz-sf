import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Creates a LangChain tool that wraps the fetchWithPayment function
 * for broadcasting messages over Meshtastic network
 */
export function createBroadcastTool(fetchWithPayment: (url: string, options?: RequestInit) => Promise<any>) {
  const PROXY_URL = (import.meta.env?.VITE_PROXY_URL as string) || "http://localhost:3000";

  return new DynamicStructuredTool({
    name: "broadcast_meshtastic_message",
    description: "Broadcasts a message over the Meshtastic network using x402 payments. The message will be sent to all nodes in the mesh network unless a specific destination ID is provided. Each broadcast costs $0.01. IMPORTANT: Message must be 100 characters or less.",
    schema: z.object({
      message: z.string().max(100).describe("The message text to broadcast over the Meshtastic network (max 100 characters)"),
      destinationId: z.string().nullable().optional().describe("Optional destination node ID (e.g., '!12345678'). Leave null or omit for broadcast to all nodes"),
    }),
    func: async ({ message, destinationId }) => {
      try {
        if (!message || !message.trim()) {
          return JSON.stringify({
            success: false,
            error: "Message cannot be empty",
          });
        }

        // Trim and validate message length (max 100 characters)
        const trimmedMessage = message.trim();
        if (trimmedMessage.length > 100) {
          return JSON.stringify({
            success: false,
            error: `Message is too long (${trimmedMessage.length} characters). Maximum length is 100 characters. Please shorten your message.`,
          });
        }

        const url = `${PROXY_URL}/broadcast`;
        const body = {
          message: trimmedMessage,
          destinationId: destinationId || null,
        };

        const response = await fetchWithPayment(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        // fetchWithPayment returns the parsed JSON response
        const result = typeof response === "string" ? JSON.parse(response) : response;

        return JSON.stringify({
          success: true,
          message: "Message broadcasted successfully",
          data: result,
        });
      } catch (error) {
        return JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    },
  });
}

