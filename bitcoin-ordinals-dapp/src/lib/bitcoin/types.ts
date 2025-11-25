/**
 * Type definitions for Bitcoin Ordinals inscription operations
 */

export type InscriptionStatus =
  | "idle"
  | "creating_order"
  | "waiting_deposit"
  | "building_psbt"
  | "waiting_signature"
  | "broadcasting"
  | "confirmed"
  | "error";

export interface InscriptionOrder {
  orderId: string;
  depositAddress: string;
  amount: number; // in sats
  feeRate: number; // sats/vB
  postage: number; // in sats
}

export interface InscriptionPSBT {
  psbt: string; // base64 encoded PSBT
  orderId: string;
}

export interface InscriptionResult {
  txid: string;
  orderId: string;
  status: InscriptionStatus;
}

export interface InscriptionError {
  message: string;
  code?: string;
}

/**
 * Wallet information from LaserEyes
 */
export interface WalletInfo {
  address: string | null;
  paymentAddress: string | null;
  connected: boolean;
  provider?: string; // Wallet provider name (e.g., "unisat", "xverse")
}

