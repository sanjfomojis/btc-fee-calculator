import axios from "axios";
import { z } from "zod";
import { env } from "@/env";

/**
 * OrdinalsBot API Client
 * 
 * Documentation: https://docs.ordinalsbot.com
 * 
 * Direct Inscription Flow:
 * 1. Create order via POST /inscribe with file data and receive address
 * 2. OrdinalsBot returns order ID and charge details
 * 3. Poll GET /order?id={id} to check status
 * 4. Once funded, OrdinalsBot creates PSBT
 * 5. Sign PSBT with wallet
 * 6. Broadcast signed transaction
 */

// Zod schemas for request/response validation

const OrdinalsBotFileSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
  dataURL: z.string(), // base64 dataURL
});

const OrdinalsBotCreateOrderRequestSchema = z.object({
  files: z.array(OrdinalsBotFileSchema),
  receiveAddress: z.string(),
  postage: z.number().optional(),
  fee: z.string(), // fee rate as string
});

export type OrdinalsBotCreateOrderRequest = z.infer<
  typeof OrdinalsBotCreateOrderRequestSchema
>;

export const OrdinalsBotCreateOrderResponseSchema = z.object({
  id: z.string(),
  charge: z.object({
    amount: z.number(),
    address: z.string().optional(), // deposit/funding address
  }),
  chainFee: z.number().optional(),
  serviceFee: z.number().optional(),
  status: z.string().optional(),
  receiveAddress: z.string().optional(),
});

export type OrdinalsBotCreateOrderResponse = z.infer<
  typeof OrdinalsBotCreateOrderResponseSchema
>;

export const OrdinalsBotOrderStatusResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  charge: z
    .object({
      amount: z.number(),
      address: z.string().optional(), // deposit/funding address
      paid: z.boolean().optional(),
    })
    .optional(),
  depositAddress: z.string().optional(), // alternative field name
  chainFee: z.number().optional(),
  serviceFee: z.number().optional(),
  receiveAddress: z.string().optional(),
  psbt: z.string().optional(), // base64 PSBT when ready
  txid: z.string().optional(), // transaction ID after broadcast
});

export type OrdinalsBotOrderStatusResponse = z.infer<
  typeof OrdinalsBotOrderStatusResponseSchema
>;

/**
 * Request type for creating a special sats PSBT
 * Public keys are obtained from LaserEyes wallet via useLaserEyes() hook:
 * - paymentPublicKey: from paymentPublicKey property
 * - ordinalPublicKey: from publicKey property (taproot/ordinal address)
 */
export interface OrdinalsBotCreateSpecialSatsPsbtRequest {
  chargeAmount: number;
  fundingAddress: string; // from the charge info
  paymentAddress: string; // common sats address (from LaserEyes paymentAddress)
  paymentPublicKey: string; // from LaserEyes paymentPublicKey
  ordinalAddress: string; // taproot ordinals address (from LaserEyes address)
  ordinalPublicKey: string; // from LaserEyes publicKey
  feeRate: number;
  specialSatsOutput?: string; // optional for now
}

/**
 * Response type for special sats PSBT creation
 */
export const OrdinalsBotCreateSpecialSatsPsbtResponseSchema = z.object({
  psbtBase64: z.string(),
  psbtHex: z.string().optional(),
  paymentInputIndices: z.array(z.number()),
  ordinalInputIndices: z.array(z.number()),
});

export type OrdinalsBotCreateSpecialSatsPsbtResponse = z.infer<
  typeof OrdinalsBotCreateSpecialSatsPsbtResponseSchema
>;

/**
 * Funding information extracted from an order
 */
export interface FundingInfo {
  fundingAddress: string | null; // from charge.address or depositAddress
  chargeAmount: number | null; // from charge.amount
  status: string;
}

// Configure axios instance
const ordinalsBotClient = axios.create({
  baseURL: env.ORDINALSBOT_API_URL || "https://api.ordinalsbot.com",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(env.ORDINALSBOT_API_KEY && {
      "x-api-key": env.ORDINALSBOT_API_KEY,
    }),
  },
});

/**
 * Create a direct inscription order with OrdinalsBot
 * 
 * @param params - Order parameters
 * @param params.dataUrl - Base64 dataURL (e.g., "data:image/png;base64,..." or "data:plain/text;base64,...")
 * @param params.receiveAddress - Bitcoin address to receive the inscription
 * @param params.postage - Postage amount in sats (default: 546)
 * @param params.feeRate - Fee rate in sats/vB (default: 10)
 * @returns Order response with ID and charge details
 */
export async function createDirectInscriptionOrder(params: {
  dataUrl: string;
  receiveAddress: string;
  postage?: number;
  feeRate?: number;
}): Promise<OrdinalsBotCreateOrderResponse> {
  // Extract mimetype and base64 data from dataURL
  const dataUrlMatch = params.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!dataUrlMatch) {
    throw new Error("Invalid dataURL format");
  }

  const [, mimeType, base64Data] = dataUrlMatch;
  
  // Determine file name and type
  const fileName =
    mimeType === "plain/text" || mimeType === "text/plain"
      ? "inscription.txt"
      : mimeType.startsWith("image/")
      ? `inscription.${mimeType.split("/")[1]}`
      : "inscription.bin";

  // Calculate size from base64 data
  const sizeInBytes = Math.floor((base64Data.length * 3) / 4);

  const payload: OrdinalsBotCreateOrderRequest = {
    files: [
      {
        name: fileName,
        size: sizeInBytes,
        type: mimeType,
        dataURL: params.dataUrl,
      },
    ],
    receiveAddress: params.receiveAddress,
    postage: params.postage ?? 546,
    fee: String(params.feeRate ?? 10),
  };

  // Validate payload
  OrdinalsBotCreateOrderRequestSchema.parse(payload);

  try {
    const response = await ordinalsBotClient.post("/inscribe", payload);
    
    // Validate and return response
    const validatedResponse = OrdinalsBotCreateOrderResponseSchema.parse(
      response.data
    );
    
    return validatedResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to create inscription order";
      throw new Error(`OrdinalsBot API error: ${message}`);
    }
    throw error;
  }
}

/**
 * Get order status from OrdinalsBot
 * 
 * @param id - Order ID
 * @returns Order status response with current state and charge details
 */
export async function getOrder(
  id: string
): Promise<OrdinalsBotOrderStatusResponse> {
  try {
    const response = await ordinalsBotClient.get("/order", {
      params: { id },
    });

    // Validate and return response
    const validatedResponse = OrdinalsBotOrderStatusResponseSchema.parse(
      response.data
    );

    return validatedResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to get order status";
      throw new Error(`OrdinalsBot API error: ${message}`);
    }
    throw error;
  }
}

/**
 * Get funding information from an order
 * 
 * @param orderId - Order ID
 * @returns Funding information including address and amount
 */
export async function getFundingInfo(
  orderId: string
): Promise<FundingInfo> {
  try {
    const order = await getOrder(orderId);
    
    // Extract funding address from charge.address or depositAddress
    const fundingAddress =
      order.charge?.address ||
      order.depositAddress ||
      null;
    
    // Extract charge amount
    const chargeAmount = order.charge?.amount || null;
    
    return {
      fundingAddress,
      chargeAmount,
      status: order.status,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to get funding info";
      throw new Error(`OrdinalsBot API error: ${message}`);
    }
    throw error;
  }
}

/**
 * Create a special sats PSBT for paying an inscription order
 * 
 * Public keys should be obtained from LaserEyes wallet:
 * - paymentPublicKey: from useLaserEyes().paymentPublicKey
 * - ordinalPublicKey: from useLaserEyes().publicKey
 * 
 * @param params - PSBT creation parameters
 * @returns PSBT in base64 and hex format with input indices
 */
export async function createSpecialSatsPsbt(
  params: OrdinalsBotCreateSpecialSatsPsbtRequest
): Promise<OrdinalsBotCreateSpecialSatsPsbtResponse> {
  try {
    const response = await ordinalsBotClient.post(
      "/create-special-sats-psbt",
      params
    );

    // Validate and return response
    const validatedResponse =
      OrdinalsBotCreateSpecialSatsPsbtResponseSchema.parse(response.data);

    return validatedResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to create PSBT";
      throw new Error(`OrdinalsBot API error: ${message}`);
    }
    throw error;
  }
}
