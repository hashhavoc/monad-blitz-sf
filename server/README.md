# FALLBACKAI

A FastAPI server for broadcasting messages over Meshtastic via serial port `/dev/cu.usbserial-0001`, with an optional x402 payment proxy wrapper.

## Overview

**FALLBACKAI** provides a REST API interface to broadcast messages over a Meshtastic mesh network. The server maintains a persistent connection to the Meshtastic device via serial port, allowing efficient message broadcasting.

The FALLBACKAI project includes:
- **Python FastAPI Server**: Core Meshtastic broadcasting functionality
- **TypeScript x402 Proxy** (optional): Payment gateway wrapper using thirdweb x402 protocol on Monad blockchain
- **React Client Application**: Web interface for broadcasting messages with automatic payment handling

## Requirements

- Python 3.10
- `uv` package manager
- Meshtastic device connected to `/dev/cu.usbserial-0001`

## Setup

### Install uv

If you don't have `uv` installed:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Install Dependencies

```bash
uv sync
```

This will create a virtual environment and install all required dependencies.

### Activate Virtual Environment

```bash
source .venv/bin/activate
```

## Usage

### Start the Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Or using uv:

```bash
uv run uvicorn main:app --host 0.0.0.0 --port 8000
```

The server will start and attempt to connect to the Meshtastic device on `/dev/cu.usbserial-0001`.

### API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### POST /broadcast

Broadcast a message over the Meshtastic network.

**Request Body:**
```json
{
  "message": "Hello, Meshtastic!"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Message broadcasted successfully",
  "text": "Hello, Meshtastic!"
}
```

**Example using curl:**
```bash
curl -X POST "http://localhost:8000/broadcast" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, Meshtastic!"}'
```

**Example using Python test client:**
```bash
# Single message
python test_client.py --message "Hello, Meshtastic!"

# Interactive mode
python test_client.py --interactive

# Health check
python test_client.py --health

# Custom server URL
python test_client.py --url http://localhost:8000 --message "Test message"
```

### GET /health

Check the health status of the server and Meshtastic connection.

**Response:**
```json
{
  "status": "healthy",
  "meshtastic_connected": true
}
```

## Configuration

The serial port is hardcoded to `/dev/cu.usbserial-0001`. To change this, modify the `devPath` parameter in `main.py`:

```python
meshtastic_interface = meshtastic.serial_interface.SerialInterface(devPath="/dev/cu.usbserial-0001")
```

## Error Handling

- **503 Service Unavailable**: Returned when the Meshtastic interface is not available (device not connected)
- **400 Bad Request**: Returned when the message is empty
- **500 Internal Server Error**: Returned when there's an error broadcasting the message

## x402 Payment Proxy (Optional)

The project includes a TypeScript proxy server that wraps the FastAPI server with x402 payment functionality, allowing you to monetize the `/broadcast` endpoint.

### Proxy Server Setup

1. **Navigate to proxy directory:**
   ```bash
   cd proxy
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the `proxy/` directory:
   ```bash
   THIRDWEB_SECRET_KEY=your_thirdweb_secret_key
   SERVER_WALLET_ADDRESS=0xYourWalletAddress
   FASTAPI_URL=http://localhost:8000
   PROXY_PORT=3000
   MONAD_RPC_URL=https://rpc.monad.xyz
   MONAD_CHAIN_ID=10143
   PRICE_PER_BROADCAST=$0.01
   ```

4. **Build TypeScript:**
   ```bash
   npm run build
   ```

5. **Start the proxy server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

### Proxy Architecture

```
Client → TypeScript Proxy (x402) → Python FastAPI Server → Meshtastic Device
```

- **Protected Endpoint**: `POST /broadcast` requires x402 payment ($0.01)
- **Free Endpoints**: `GET /health` and other endpoints pass through without payment
- **Blockchain**: Monad (Chain ID: 10143)

### Using the Proxy

Once the proxy is running on port 3000, clients need to:

1. Make a request to `POST http://localhost:3000/broadcast`
2. Receive a `402 Payment Required` response with payment details
3. Sign and submit payment using an x402-compatible client
4. Retry the request with the `x-payment` header
5. Receive the broadcast response after successful payment

### TypeScript Client Example

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

// Make paid request
const response = await fetchWithPayment(
  "http://localhost:3000/broadcast",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Hello, Meshtastic!",
      destinationId: null, // Optional
    }),
  }
);

const data = await response.json();
console.log(data);
```

## Notes

- The Meshtastic connection is established when the server starts and remains open until the server shuts down
- Ensure your Meshtastic device is properly connected and configured before starting the server
- The device must be accessible at `/dev/cu.usbserial-0001` (macOS) or the appropriate serial port for your system
- The x402 proxy requires a valid thirdweb secret key and server wallet address
- Payments are processed on the Monad blockchain

