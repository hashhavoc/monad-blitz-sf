import dotenv from "dotenv";
import { createThirdwebClient } from "thirdweb";
import { facilitator } from "thirdweb/x402";
import { defineChain } from "thirdweb/chains";

// Load environment variables
dotenv.config();

// Monad Chain Configuration
// Chain ID: 10143 (Monad mainnet)
export const monadChain = defineChain({
  id: parseInt(process.env.MONAD_CHAIN_ID || "10143"),
  name: "Monad",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpc: process.env.MONAD_RPC_URL || "https://rpc.monad.xyz",
  blockExplorers: [
    {
      name: "Monad Explorer",
      url: "https://explorer.monad.xyz",
    },
  ],
});

// Validate required environment variables
const requiredEnvVars = [
  "THIRDWEB_SECRET_KEY",
  "SERVER_WALLET_ADDRESS",
  "FASTAPI_URL",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Thirdweb client configuration
export const thirdwebClient = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

// Server wallet address (receives payments)
export const serverWalletAddress = process.env.SERVER_WALLET_ADDRESS!;

// FastAPI server URL
export const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";

// Proxy server port
export const proxyPort = parseInt(process.env.PROXY_PORT || "3000");

// Price per broadcast
export const pricePerBroadcast = process.env.PRICE_PER_BROADCAST || "$0.01";

// x402 Facilitator configuration
export const thirdwebFacilitator = facilitator({
  client: thirdwebClient,
  serverWalletAddress: serverWalletAddress,
});

// Export configuration object
export const config = {
  thirdwebClient,
  serverWalletAddress,
  fastApiUrl,
  proxyPort,
  pricePerBroadcast,
  monadChain,
  thirdwebFacilitator,
};

