import { Request, Response } from "express";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import { fastApiUrl } from "./config";

/**
 * Proxy configuration for forwarding requests to FastAPI server
 */
const proxyOptions: Options = {
  target: fastApiUrl,
  changeOrigin: true,
  ws: true, // Enable websocket proxying
  logLevel: "info",
  onError: (err: Error, req: Request, res: Response) => {
    console.error("Proxy error:", err);
    if (!res.headersSent) {
      res.status(503).json({
        error: "FastAPI server unavailable",
        message: "The backend server is not responding",
      });
    }
  },
  onProxyReq: (proxyReq, req) => {
    // Preserve original request body
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader("Content-Type", "application/json");
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
};

/**
 * Create proxy middleware instance
 */
export const fastApiProxy = createProxyMiddleware(proxyOptions);

/**
 * Manual proxy handler for more control
 */
export async function proxyRequest(req: Request, res: Response): Promise<void> {
  try {
    const url = `${fastApiUrl}${req.originalUrl}`;
    const method = req.method;
    const headers: Record<string, string> = {};
    
    // Copy headers, excluding host
    Object.keys(req.headers).forEach((key) => {
      if (key.toLowerCase() !== "host") {
        const value = req.headers[key];
        if (typeof value === "string") {
          headers[key] = value;
        } else if (Array.isArray(value)) {
          headers[key] = value.join(", ");
        }
      }
    });

    const fetchOptions: {
      method: string;
      headers: Record<string, string>;
      body?: string;
    } = {
      method,
      headers,
    };

    // Include body for POST/PUT/PATCH requests
    if (["POST", "PUT", "PATCH"].includes(method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      headers["content-type"] = "application/json";
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.text();

    // Forward response headers
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // Forward status and body
    res.status(response.status).send(data);
  } catch (error) {
    console.error("Proxy request error:", error);
    if (!res.headersSent) {
      res.status(503).json({
        error: "FastAPI server unavailable",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

