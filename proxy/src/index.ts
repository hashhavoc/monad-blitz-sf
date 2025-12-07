import express, { Request, Response } from "express";
import cors from "cors";
import { x402PaymentMiddleware } from "./x402-middleware";
import { fastApiProxy } from "./proxy";
import { proxyPort, fastApiUrl } from "./config";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint - no payment required
app.get("/health", fastApiProxy);

// Broadcast endpoint - requires x402 payment
app.post("/broadcast", x402PaymentMiddleware, fastApiProxy);

// Proxy all other requests to FastAPI server (no payment required)
app.use("/", fastApiProxy);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error("Server error:", err);
  if (!res.headersSent) {
    res.status(500).json({
      error: "Internal server error",
      message: err.message,
    });
  }
});

// Start server
const PORT = proxyPort;
app.listen(PORT, () => {
  console.log(`🚀 x402 Proxy Server running on port ${PORT}`);
  console.log(`📡 Proxying to FastAPI server at ${fastApiUrl}`);
  console.log(`💰 Protected endpoint: POST /broadcast (${process.env.PRICE_PER_BROADCAST || "$0.01"})`);
  console.log(`🔗 Health check: GET /health (no payment required)`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

