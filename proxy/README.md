# FALLBACKAI x402 Payment Proxy

TypeScript proxy server that wraps the Python FastAPI Meshtastic server with x402 payment functionality. Part of the FALLBACKAI project.

## Overview

This proxy server:
- Protects the `/broadcast` endpoint with x402 payments ($0.01 per request)
- Processes payments on Monad blockchain
- Forwards authenticated requests to the Python FastAPI server
- Allows free access to `/health` and other endpoints

## Prerequisites

- Node.js 18+ (for native fetch support)
- npm or yarn
- Running Python FastAPI server on port 8000
- Thirdweb account with secret key
- Monad wallet address for receiving payments

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your configuration:
   ```env
   THIRDWEB_SECRET_KEY=your_thirdweb_secret_key
   SERVER_WALLET_ADDRESS=0xYourWalletAddress
   FASTAPI_URL=http://localhost:8000
   PROXY_PORT=3000
   MONAD_RPC_URL=https://rpc.monad.xyz
   MONAD_CHAIN_ID=10143
   PRICE_PER_BROADCAST=$0.01
   ```

3. **Build TypeScript:**
   ```bash
   npm run build
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

   Or for development:
   ```bash
   npm run dev
   ```

## Usage

### Start Both Servers

1. **Start Python FastAPI server:**
   ```bash
   # In project root
   uv run uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. **Start TypeScript proxy:**
   ```bash
   # In proxy directory
   npm start
   ```

### Making Paid Requests

Clients need to use an x402-compatible client library. Example using thirdweb:

```typescript
import { wrapFetchWithPayment } from "thirdweb/x402";
import { createThirdwebClient } from "thirdweb";
import { createWallet } from "thirdweb/wallets";

const client = createThirdwebClient({
  clientId: "your_client_id",
});

const wallet = createWallet("io.metamask");
await wallet.connect();

const fetchWithPayment = wrapFetchWithPayment({
  client,
  wallet,
});

const response = await fetchWithPayment(
  "http://localhost:3000/broadcast",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Hello, Meshtastic!",
    }),
  }
);
```

## Architecture

```
Client Request
    ↓
TypeScript Proxy (x402 verification)
    ↓
Payment Valid? → No → Return 402 Payment Required
    ↓ Yes
Forward to FastAPI Server
    ↓
Return Response
```

## Endpoints

- `POST /broadcast` - **Protected** - Requires x402 payment ($0.01)
- `GET /health` - **Free** - Health check (proxied to FastAPI)
- All other endpoints - **Free** - Proxied to FastAPI

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `THIRDWEB_SECRET_KEY` | Your thirdweb secret key | Yes | - |
| `SERVER_WALLET_ADDRESS` | Wallet address receiving payments | Yes | - |
| `FASTAPI_URL` | Python FastAPI server URL | Yes | `http://localhost:8000` |
| `PROXY_PORT` | Port for proxy server | No | `3000` |
| `MONAD_RPC_URL` | Monad RPC endpoint | No | `https://rpc.monad.xyz` |
| `MONAD_CHAIN_ID` | Monad chain ID | No | `10143` |
| `PRICE_PER_BROADCAST` | Price per broadcast request | No | `$0.01` |

### Monad Blockchain

The proxy is configured for Monad mainnet (Chain ID: 10143). To use testnet or a different network, update the `MONAD_CHAIN_ID` and `MONAD_RPC_URL` in your `.env` file.

## Development

- `npm run build` - Compile TypeScript
- `npm run dev` - Run with ts-node (development)
- `npm start` - Run compiled JavaScript (production)
- `npm run watch` - Watch mode for TypeScript compilation

## Troubleshooting

### Payment Verification Fails

- Ensure `THIRDWEB_SECRET_KEY` is valid
- Verify `SERVER_WALLET_ADDRESS` is correct
- Check Monad RPC endpoint is accessible
- Verify network configuration matches your wallet

### FastAPI Server Unavailable

- Ensure Python FastAPI server is running on port 8000
- Check `FASTAPI_URL` in `.env` matches your server URL
- Verify Meshtastic device is connected

### TypeScript Compilation Errors

- Ensure Node.js 18+ is installed
- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` configuration

