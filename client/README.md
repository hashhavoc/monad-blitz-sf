# FALLBACKAI Client - React App

A React application using thirdweb's x402 client to broadcast messages over the Meshtastic network with automatic payment handling on the Monad blockchain. Part of the FALLBACKAI project.

## Features

- **React UI**: Modern interface for broadcasting Meshtastic messages
- **Automatic Payment Handling**: Uses `useFetchWithPayment` hook to automatically handle 402 Payment Required responses
- **Wallet Connection**: Connect wallet with built-in UI prompts (email, phone, social, passkey, guest)
- **Monad Integration**: Configured for Monad chain (Chain ID: 10143)
- **Balance Checking**: View wallet balance before making broadcasts
- **Health Check**: Monitor server and Meshtastic connection status
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Built-in Modals**: Automatic UI for wallet connection, funding, and payment retries

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
   VITE_PROXY_URL=http://localhost:3000
   ```

3. **Get your thirdweb Client ID:**
   - Go to [thirdweb dashboard](https://thirdweb.com/dashboard)
   - Create a new project or use an existing one
   - Copy your Client ID

## Usage

### Development (with hot reload)
```bash
npm run dev
```

This will start the Vite dev server, typically at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## How It Works

1. **Connect Wallet**: Click "Connect Wallet" to connect using thirdweb's in-app wallet
2. **Check Balance**: View your Monad wallet balance
3. **Enter Message**: Type your message to broadcast
4. **Optional Destination**: Enter a specific node ID or leave empty for broadcast to all
5. **Broadcast**: Click "Broadcast Message" - the app will automatically:
   - Make the request to `/broadcast` endpoint
   - Handle 402 Payment Required responses
   - Show payment modals if needed
   - Sign and submit payment ($0.01)
   - Retry with payment credentials
   - Display the broadcast result

## API Endpoints

The app connects to the x402 proxy server:

- **POST /broadcast** - Broadcast message (requires x402 payment of $0.01)
- **GET /health** - Check server health (no payment required)

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_THIRDWEB_CLIENT_ID` | Your thirdweb client ID | Yes | - |
| `VITE_PROXY_URL` | Proxy server URL | No | `http://localhost:3000` |

### Monad Blockchain

- Chain ID: 10143 (Monad mainnet)
- RPC URL: `https://rpc.monad.xyz`
- Payment: $0.01 per broadcast

## UI Components

The app includes:
- **Health Status**: Shows server and Meshtastic connection status
- **Wallet Connection Section**: Connect and view wallet information
- **Balance Display**: Shows your Monad balance
- **Message Input**: Textarea for entering broadcast message
- **Destination Input**: Optional field for specific node ID
- **Response Display**: Shows formatted JSON responses
- **Error Handling**: User-friendly error messages

## Technical Details

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Blockchain**: Monad (Chain ID: 10143)
- **RPC URL**: `https://rpc.monad.xyz`
- **Payment Protocol**: x402
- **Wallet**: In-app wallet (supports email, phone, social, passkey, guest)

## Example Usage

1. Start the dev server: `npm run dev`
2. Open the app in your browser
3. Click "Connect Wallet" to connect
4. Enter your message in the textarea
5. Optionally enter a destination node ID
6. Click "Broadcast Message ($0.01)"
7. If payment is required, the app will automatically handle it with built-in modals

## Notes

- The `useFetchWithPayment` hook automatically handles payment UI modals
- Payments are processed on Monad blockchain
- Each broadcast costs $0.01
- Health check is free and doesn't require wallet connection
- For production, consider using other wallet strategies like email, phone, or social login

## Documentation

- [Thirdweb x402 Client Documentation](https://portal.thirdweb.com/x402/client)
- [Thirdweb React SDK](https://portal.thirdweb.com/react)
- [Vite Documentation](https://vitejs.dev/)
- [Proxy Server Documentation](../proxy/README.md)
