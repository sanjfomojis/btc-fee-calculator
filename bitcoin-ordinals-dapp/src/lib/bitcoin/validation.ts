/**
 * Validation utilities for Bitcoin transactions and inscriptions
 */

import * as bitcoin from "bitcoinjs-lib";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a Bitcoin address
 */
export function validateAddress(
  address: string,
  network?: bitcoin.Network
): ValidationResult {
  try {
    bitcoin.address.toOutputScript(address, network || bitcoin.networks.bitcoin);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid Bitcoin address: ${address}`,
    };
  }
}

/**
 * Validate a taproot (P2TR) address
 */
export function validateTaprootAddress(
  address: string,
  network?: bitcoin.Network
): ValidationResult {
  const result = validateAddress(address, network);
  if (!result.valid) {
    return result;
  }

  try {
    const script = bitcoin.address.toOutputScript(
      address,
      network || bitcoin.networks.bitcoin
    );
    // P2TR addresses start with OP_1 (0x51) followed by 32 bytes
    if (script[0] !== 0x51 || script.length !== 34) {
      return {
        valid: false,
        error: "Address must be a taproot (P2TR) address",
      };
    }
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: "Failed to validate taproot address",
    };
  }
}

/**
 * Validate fee rate
 */
export function validateFeeRate(feeRate: number): ValidationResult {
  if (feeRate <= 0) {
    return {
      valid: false,
      error: "Fee rate must be greater than 0",
    };
  }

  if (feeRate > 1000) {
    return {
      valid: false,
      error: "Fee rate seems unusually high (>1000 sats/vB). Please verify.",
    };
  }

  return { valid: true };
}

/**
 * Validate inscription content size
 */
export function validateInscriptionContent(content: Uint8Array): ValidationResult {
  const maxSize = 400 * 1024; // 400 KB (Bitcoin transaction size limit is ~400KB, but inscriptions are typically smaller)

  if (content.length === 0) {
    return {
      valid: false,
      error: "Inscription content cannot be empty",
    };
  }

  if (content.length > maxSize) {
    return {
      valid: false,
      error: `Inscription content too large: ${content.length} bytes. Maximum: ${maxSize} bytes`,
    };
  }

  return { valid: true };
}

/**
 * Validate UTXO data
 */
export function validateUtxo(utxo: {
  txid: string;
  vout: number;
  value: number;
}): ValidationResult {
  // Validate txid format (64 hex characters)
  if (!/^[0-9a-fA-F]{64}$/.test(utxo.txid)) {
    return {
      valid: false,
      error: `Invalid transaction ID format: ${utxo.txid}`,
    };
  }

  // Validate vout
  if (utxo.vout < 0 || !Number.isInteger(utxo.vout)) {
    return {
      valid: false,
      error: `Invalid output index: ${utxo.vout}`,
    };
  }

  // Validate value
  if (utxo.value <= 0 || !Number.isInteger(utxo.value)) {
    return {
      valid: false,
      error: `Invalid UTXO value: ${utxo.value}`,
    };
  }

  return { valid: true };
}

/**
 * Validate public key format
 */
export function validatePublicKey(publicKey: string | Buffer): ValidationResult {
  let keyBuffer: Buffer;

  if (typeof publicKey === "string") {
    // Check if it's hex
    if (!/^[0-9a-fA-F]+$/.test(publicKey)) {
      return {
        valid: false,
        error: "Public key must be in hexadecimal format",
      };
    }

    try {
      keyBuffer = Buffer.from(publicKey, "hex");
    } catch (error) {
      return {
        valid: false,
        error: "Invalid public key format",
      };
    }
  } else {
    keyBuffer = publicKey;
  }

  // Public keys are typically 33 bytes (compressed) or 65 bytes (uncompressed)
  // For taproot, we use x-only pubkeys (32 bytes)
  if (keyBuffer.length !== 32 && keyBuffer.length !== 33 && keyBuffer.length !== 65) {
    return {
      valid: false,
      error: `Invalid public key length: ${keyBuffer.length} bytes. Expected 32, 33, or 65 bytes`,
    };
  }

  return { valid: true };
}

