import axios from "axios";
import { env } from "@/env";

/**
 * Bitcoin transaction broadcasting utilities
 * 
 * API Documentation: https://mempool.space/api
 * 
 * For testnet/signet:
 * - Testnet: https://mempool.space/testnet/api/tx
 * - Signet: https://mempool.space/signet/api/tx
 * 
 * TODO: Add network detection and use appropriate endpoint
 */

/**
 * Get the mempool.space API base URL based on network
 */
function getMempoolBaseUrl(): string {
  const network = env.BITCOIN_NETWORK || env.NEXT_PUBLIC_NETWORK || "mainnet";
  
  if (network === "testnet") {
    return "https://mempool.space/testnet/api";
  }
  // TODO: Add signet support
  // if (network === "signet") {
  //   return "https://mempool.space/signet/api";
  // }
  
  // Default to mainnet
  return env.MEMPOOL_API_URL || "https://mempool.space/api";
}

const mempoolClient = axios.create({
  baseURL: getMempoolBaseUrl(),
  headers: {
    "Content-Type": "text/plain",
  },
});

/**
 * Broadcast a raw transaction to the Bitcoin network via mempool.space
 * 
 * @param rawTxHex - Raw transaction hex string
 * @returns Transaction ID (txid)
 * 
 * API Documentation: https://mempool.space/api#post-tx
 */
export async function broadcastRawTxViaMempool(
  rawTxHex: string
): Promise<string> {
  try {
    // Mempool.space expects raw hex as plain text in the request body
    const response = await mempoolClient.post("/tx", rawTxHex, {
      headers: {
        "Content-Type": "text/plain",
      },
    });

    // Mempool.space returns the txid as a string
    const txid = response.data;
    
    if (!txid || typeof txid !== "string") {
      throw new Error("Invalid response from mempool.space");
    }
    
    return txid;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Failed to broadcast transaction";
      throw new Error(`Mempool.space API error: ${message}`);
    }
    throw error;
  }
}

/**
 * Broadcast a signed transaction to the Bitcoin network
 * Alias for broadcastRawTxViaMempool for backward compatibility
 */
export async function broadcastTransaction(
  signedTxHex: string
): Promise<string> {
  return broadcastRawTxViaMempool(signedTxHex);
}
