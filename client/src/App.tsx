import { useState, useEffect, useRef } from "react";
import { createThirdwebClient } from "thirdweb";
import { ConnectButton, useActiveAccount, useActiveWalletChain, useSwitchActiveWalletChain, useDisconnect, useActiveWallet } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { getWalletBalance } from "thirdweb/wallets";
import { useFetchWithPayment } from "thirdweb/react";
import type { Wallet } from "thirdweb/wallets";
import { createMeshtasticAgent } from "./agent";
import { ChatMessage } from "./types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Monad chain configuration
const MONAD_CHAIN = {
  id: 10143,
  name: "Monad",
  rpc: "https://testnet-rpc.monad.xyz",
} as const;

// Proxy server URL
const PROXY_URL = (import.meta.env?.VITE_PROXY_URL as string) || "http://localhost:3000";

// Initialize the thirdweb client
const client = createThirdwebClient({
  clientId: (import.meta.env?.VITE_THIRDWEB_CLIENT_ID as string) || "d53653041ffe819598f5a2584c809c93",
});

// Configure in-app wallet
const userWallet = inAppWallet({
  metadata: {
    name: "Meshtastic x402 Wallet",
    icon: "https://monad.xyz/favicon.ico",
  },
});

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      content: "Hello! I'm your Meshtastic assistant. I can help you broadcast messages over the Meshtastic network. Just tell me what you'd like to send!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();
  const [userInfo, setUserInfo] = useState<{ email?: string; phone?: string; type?: string } | null>(null);

  // Use the x402 hook for making paid API calls
  const { fetchWithPayment } = useFetchWithPayment(client, {
    theme: "dark",
  });

  // Initialize agent when wallet is connected
  useEffect(() => {
    const initAgent = async () => {
      if (account && fetchWithPayment && !agent) {
        try {
          const newAgent = await createMeshtasticAgent(fetchWithPayment);
          setAgent(newAgent);
          addMessage("system", "Agent initialized and ready to help you broadcast messages!");
        } catch (error) {
          console.error("Failed to initialize agent:", error);
          addMessage("system", "Failed to initialize AI agent. Please check your Anthropic API key configuration.");
        }
      }
    };

    initAgent();
  }, [account, fetchWithPayment]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-switch to Monad when wallet connects to a different chain
  useEffect(() => {
    if (account && chain && chain.id !== MONAD_CHAIN.id) {
      switchChain(MONAD_CHAIN).catch((err) => {
        console.warn("Auto-switch to Monad failed:", err);
      });
    }
  }, [account, chain, switchChain]);

  // Fetch user wallet information when connected
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (wallet && account) {
        try {
          const walletInstance = wallet as Wallet & { getAuthToken?: () => Promise<string> };
          if (walletInstance && typeof walletInstance.getAuthToken === 'function') {
            const authToken = await walletInstance.getAuthToken();
            if (authToken) {
              try {
                const payload = JSON.parse(atob(authToken.split('.')[1]));
                setUserInfo({
                  email: payload.email,
                  phone: payload.phone,
                  type: payload.type || 'guest',
                });
              } catch (e) {
                console.log("Could not decode auth token");
              }
            }
          }
        } catch (err) {
          console.log("Could not fetch user info:", err);
        }
      } else {
        setUserInfo(null);
      }
    };

    fetchUserInfo();
  }, [wallet, account]);

  // Check health status on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${PROXY_URL}/health`);
        const data = await response.json();
        setHealthStatus(data);
      } catch (err) {
        setHealthStatus({ error: "Health check failed" });
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const addMessage = (role: "user" | "assistant" | "system", content: string, toolCalls?: ChatMessage["toolCalls"]) => {
    setMessages((prev) => [...prev, { role, content, timestamp: new Date(), toolCalls }]);
  };

  const handleCheckBalance = async () => {
    if (!account) {
      addMessage("system", "Please connect your wallet first");
      return;
    }

    try {
      const balanceResult = await getWalletBalance({
        address: account.address,
        client: client,
        chain: MONAD_CHAIN,
      });
      setBalance(`${balanceResult.displayValue} ${balanceResult.symbol}`);
      addMessage("system", `Your balance: ${balanceResult.displayValue} ${balanceResult.symbol}`);
    } catch (err) {
      addMessage("system", `Failed to fetch balance: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    if (!account) {
      addMessage("system", "Please connect your wallet first to send messages");
      return;
    }

    if (!agent) {
      addMessage("system", "Agent is not initialized yet. Please wait...");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    addMessage("user", userMessage);

    try {
      let assistantMessageIndex = messages.length;
      addMessage("assistant", "");

      const systemPrompt = (agent as any).systemPrompt;
      const conversationHistory: any[] = [];
      
      if (systemPrompt) {
        conversationHistory.push({ role: "system", content: systemPrompt });
      }
      
      messages.forEach((msg) => {
        if ((msg.role === "user" || msg.role === "assistant") && msg.content && msg.content.trim()) {
          conversationHistory.push({
            role: msg.role,
            content: msg.content,
          });
        }
      });
      
      const lastMsg = conversationHistory[conversationHistory.length - 1];
      if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== userMessage) {
        conversationHistory.push({
          role: "user",
          content: userMessage,
        });
      }

      const stream = await agent.stream({
        messages: conversationHistory,
      });

      let assistantResponse = "";
      for await (const chunk of stream) {
        if (chunk.agent?.messages) {
          const lastMessage = chunk.agent.messages[chunk.agent.messages.length - 1];
          if (lastMessage?.content && typeof lastMessage.content === "string") {
            assistantResponse = lastMessage.content;
          }
        } else if (chunk.messages) {
          const lastMessage = chunk.messages[chunk.messages.length - 1];
          if (lastMessage?.content && typeof lastMessage.content === "string") {
            assistantResponse = lastMessage.content;
          }
        } else if (typeof chunk === "string") {
          assistantResponse += chunk;
        } else if (chunk.content) {
          assistantResponse += chunk.content;
        }

        if (assistantResponse) {
          setMessages((prev) => {
            const newMessages = [...prev];
            if (newMessages[assistantMessageIndex + 1]) {
              newMessages[assistantMessageIndex + 1] = {
                ...newMessages[assistantMessageIndex + 1],
                content: assistantResponse,
              };
            }
            return newMessages;
          });
        }
      }

      if (!assistantResponse) {
        assistantResponse = "I've processed your request. The message should be sent over the Meshtastic network.";
      }

      setMessages((prev) => {
        const newMessages = [...prev];
        if (newMessages[assistantMessageIndex + 1]) {
          newMessages[assistantMessageIndex + 1] = {
            ...newMessages[assistantMessageIndex + 1],
            content: assistantResponse,
          };
        }
        return newMessages;
      });
    } catch (error) {
      console.error("Error sending message:", error);
      addMessage("assistant", `Error: ${error instanceof Error ? error.message : "Failed to send message"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDisconnect = async () => {
    try {
      if (wallet) {
        disconnect(wallet);
        setBalance(null);
        setAgent(null);
        addMessage("system", "Wallet disconnected");
      }
    } catch (err) {
      addMessage("system", `Failed to disconnect: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <div className="w-72 border-r border-border bg-card p-6 overflow-y-auto flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <ConnectButton
                client={client}
                chain={MONAD_CHAIN}
                wallets={[userWallet]}
                connectButton={{
                  label: "Connect Wallet",
                }}
                connectModal={{
                  title: "Connect to Monad",
                  size: "compact",
                  titleIcon: "https://monad.xyz/favicon.ico",
                }}
                theme="dark"
              />
            </div>
            
            {account && (
              <div className="space-y-3 pt-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Address</p>
                  <p className="text-xs font-mono text-foreground break-all">{account.address}</p>
                </div>
                {chain && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Chain: {chain.name} (ID: {chain.id})
                      {chain.id !== MONAD_CHAIN.id && (
                        <span className="text-yellow-500 ml-1">⚠️</span>
                      )}
                    </p>
                  </div>
                )}
                {userInfo && (
                  <div className="bg-muted/50 rounded-md p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Auth:</span> {userInfo.type || 'guest'}
                    </p>
                    {userInfo.email && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Email:</span> {userInfo.email}
                      </p>
                    )}
                  </div>
                )}
                {balance && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Balance:</span> {balance}
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-2">
                  {chain && chain.id !== MONAD_CHAIN.id && (
                    <Button
                      onClick={() => switchChain(MONAD_CHAIN)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Switch to Monad
                    </Button>
                  )}
                  <Button
                    onClick={handleCheckBalance}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Check Balance
                  </Button>
                  <Button
                    onClick={handleDisconnect}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        <div className="border-b border-border px-6 py-4">
          <h1 className="text-2xl font-semibold">Meshtastic Assistant</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered messaging over the Meshtastic network</p>
        </div>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="flex flex-col gap-4 max-w-4xl mx-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  "flex gap-3 max-w-[80%] animate-in fade-in slide-in-from-bottom-2",
                  msg.role === "user" && "self-end flex-row-reverse",
                  msg.role === "assistant" && "self-start",
                  msg.role === "system" && "self-center max-w-[90%] opacity-80"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm flex-shrink-0">
                  {msg.role === "user" ? "👤" : msg.role === "assistant" ? "🤖" : "ℹ️"}
                </div>
                <div className="rounded-lg bg-card border border-border p-3 shadow-sm">
                  <p className="text-sm text-foreground whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 self-start max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm flex-shrink-0">
                  🤖
                </div>
                <div className="rounded-lg bg-card border border-border p-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-border p-4 bg-card">
          <div className="max-w-4xl mx-auto flex gap-3">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={account ? "Type your message..." : "Connect wallet to send messages..."}
              disabled={!account || isLoading}
              className="min-h-[60px] resize-none"
              rows={2}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || !account || isLoading}
              size="icon"
              className="h-[60px] w-[60px] flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-72 border-l border-border bg-card p-6 overflow-y-auto flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status</CardTitle>
          </CardHeader>
          <CardContent>
            {healthStatus && (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Server:</span>{" "}
                    <span className={cn(
                      healthStatus.status === "healthy" ? "text-green-500" : "text-red-500"
                    )}>
                      {healthStatus.status || "unknown"}
                    </span>
                  </p>
                </div>
                {healthStatus.meshtastic_connected !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Meshtastic:</span>{" "}
                      <span className={cn(
                        healthStatus.meshtastic_connected ? "text-green-500" : "text-red-500"
                      )}>
                        {healthStatus.meshtastic_connected ? "Connected" : "Disconnected"}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This chat interface uses AI to help you broadcast messages over the Meshtastic network.
            </p>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium">Cost:</span> $0.01 per broadcast
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Network:</span> Monad Testnet
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Payment:</span> Automatic via x402
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
