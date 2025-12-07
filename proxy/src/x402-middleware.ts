import { Request, Response, NextFunction } from "express";
import { settlePayment } from "thirdweb/x402";
import {
  config,
  serverWalletAddress,
  pricePerBroadcast,
  monadChain,
  thirdwebFacilitator,
} from "./config";

/**
 * x402 Payment Middleware
 * Verifies and settles payments before allowing requests to proceed
 */
export async function x402PaymentMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const resourceUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    const method = req.method.toUpperCase();
    const paymentData = req.headers["x-payment"] as string | undefined;

    console.log(`[x402] Request: ${method} ${resourceUrl}`);
    console.log(`[x402] Payment data present: ${!!paymentData}`);

    // Verify and settle payment
    // settlePayment handles undefined paymentData by returning 402 Payment Required
    let result;
    try {
      result = await settlePayment({
        resourceUrl,
        method,
        paymentData: paymentData || undefined, // Explicitly pass undefined if not present
        payTo: serverWalletAddress,
        network: monadChain,
        price: pricePerBroadcast,
        facilitator: thirdwebFacilitator,
        routeConfig: {
          description: "Broadcast message over Meshtastic network",
          mimeType: "application/json",
          maxTimeoutSeconds: 300,
        },
      });
    } catch (settleError) {
      // If settlePayment throws an error when paymentData is missing,
      // construct a proper 402 response
      if (!paymentData) {
        console.log(`[x402] No payment data, returning 402 Payment Required`);
        res.status(402).json({
          error: "Payment required",
          message: "X-PAYMENT header is required",
          payment: {
            amount: pricePerBroadcast,
            payTo: serverWalletAddress,
            network: monadChain.name,
            chainId: monadChain.id,
            resourceUrl,
            method,
          },
        });
        return;
      }
      // Re-throw if paymentData was present but verification failed
      throw settleError;
    }

    console.log(`[x402] Payment result status: ${result.status}`);

    if (result.status === 200) {
      // Payment verified and settled successfully
      // Set payment receipt headers
      for (const [key, value] of Object.entries(result.responseHeaders)) {
        res.setHeader(key, value);
      }
      // Continue to next middleware/handler
      next();
    } else {
      // Payment required (402) or invalid payment
      // Set response headers from x402 result
      for (const [key, value] of Object.entries(result.responseHeaders)) {
        res.setHeader(key, value);
      }
      // Return 402 Payment Required with payment details
      console.log(`[x402] Returning ${result.status} with payment details`);
      res.status(result.status).json(result.responseBody);
    }
  } catch (error) {
    console.error("x402 payment middleware error:", error);
    console.error("Error details:", error instanceof Error ? error.stack : error);
    
    // If it's a payment-related error, try to return a proper 402 response
    if (error instanceof Error && error.message.includes("payment")) {
      // Return a 402 response with error details
      res.status(402).json({
        error: "Payment required",
        message: error.message,
        payment: {
          amount: pricePerBroadcast,
          payTo: serverWalletAddress,
          network: monadChain.name,
          chainId: monadChain.id,
        },
      });
    } else {
      res.status(500).json({
        error: "Payment verification failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
}

