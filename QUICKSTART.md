# FALLBACKAI Quick Start Guide

This guide will help you quickly set up and run all components of the FALLBACKAI project.

## Prerequisites

Before starting, ensure you have:

- **Python 3.10** and `uv` package manager ([install guide](https://github.com/astral-sh/uv))
- **Node.js 18+** (for proxy and client)
- **Meshtastic device** connected to `/dev/cu.usbserial-0001` (or configure your serial port)
- **Thirdweb account** with secret key (for proxy) and Client ID (for client)
- **Monad wallet address** for receiving payments (for proxy)

## Quick Setup

### 1. Server Setup

Navigate to the server directory and install dependencies:

```bash
cd server
uv sync
```

**Configure Serial Port** (if different from default):
Edit `server/main.py` and update the `devPath` parameter:
```python
meshtastic_interface = meshtastic.serial_interface.SerialInterface(devPath="/dev/cu.usbserial-0001")
```

**Start the Server:**
```bash
# Activate virtual environment (if needed)
source .venv/bin/activate

# Start server
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

The server will be available at `http://localhost:8000`
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### 2. Proxy Setup (Optional - for payment processing)

Navigate to the proxy directory:

```bash
cd proxy
npm install
```

**Configure Environment Variables:**
Create a `.env` file in the `proxy/` directory:

```env
THIRDWEB_SECRET_KEY=your_thirdweb_secret_key
SERVER_WALLET_ADDRESS=0xYourWalletAddress
FASTAPI_URL=http://localhost:8000
PROXY_PORT=3000
MONAD_RPC_URL=https://rpc.monad.xyz
MONAD_CHAIN_ID=10143
PRICE_PER_BROADCAST=$0.01
```

**Build and Start:**
```bash
npm run build
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The proxy will be available at `http://localhost:3000`

### 3. Client Setup

Navigate to the client directory:

```bash
cd client
npm install
```

**Configure Environment Variables:**
Create a `.env` file in the `client/` directory:

```env
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
VITE_PROXY_URL=http://localhost:3000
```

**Get your Thirdweb Client ID:**
1. Go to [thirdweb dashboard](https://thirdweb.com/dashboard)
2. Create a new project or use an existing one
3. Copy your Client ID

**Start Development Server:**
```bash
npm run dev
```

The client will be available at `http://localhost:5173`

## Running the Full Stack

To run all components simultaneously, open three terminal windows:

### Terminal 1 - Server
```bash
cd server
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

### Terminal 2 - Proxy (if using payments)
```bash
cd proxy
npm run dev
```

### Terminal 3 - Client
```bash
cd client
npm run dev
```

## Usage

### Direct API Usage (Without Proxy)

You can interact with the server directly using curl or any HTTP client:

```bash
curl -X POST "http://localhost:8000/broadcast" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, Meshtastic!"}'
```

### Using the Web Client

1. Open `http://localhost:5173` in your browser
2. Click "Connect Wallet" to connect using thirdweb's in-app wallet
3. Enter your message in the textarea
4. Optionally enter a destination node ID (leave empty for broadcast to all)
5. Click "Broadcast Message ($0.01)"
6. The app will automatically handle payment processing if using the proxy

### Using the Proxy (With Payments)

When using the proxy, clients must use an x402-compatible client library. See the [proxy README](proxy/README.md) for detailed examples.

## Next Steps

- Check the [main README](README.md) for detailed configuration options
- Review component-specific documentation:
  - [Server Documentation](server/README.md)
  - [Proxy Documentation](proxy/README.md)
  - [Client Documentation](client/README.md)

## Troubleshooting

### Server Issues

- **Meshtastic device not found**: Ensure device is connected and check serial port path
- **503 Service Unavailable**: Device not connected or serial port incorrect
- **Connection errors**: Verify Meshtastic device is properly configured

### Proxy Issues

- **Payment verification fails**: Check `THIRDWEB_SECRET_KEY` and `SERVER_WALLET_ADDRESS`
- **FastAPI server unavailable**: Ensure server is running on port 8000
- **TypeScript compilation errors**: Ensure Node.js 18+ is installed

### Client Issues

- **Wallet connection fails**: Verify `VITE_THIRDWEB_CLIENT_ID` is correct
- **Payment modals not appearing**: Check proxy is running and accessible
- **Build errors**: Ensure all dependencies are installed with `npm install`

