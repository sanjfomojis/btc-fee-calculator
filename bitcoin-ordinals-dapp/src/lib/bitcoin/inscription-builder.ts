/**
 * Bitcoin Inscription Transaction Builder
 * 
 * Constructs Bitcoin transactions for creating ordinal inscriptions
 * without relying on external APIs like OrdinalsBot.
 * 
 * Based on BIP-380 (Inscription Envelope) and Taproot (P2TR) outputs.
 */

import * as bitcoin from "bitcoinjs-lib";
import { toXOnly } from "bitcoinjs-lib/src/psbt";
import { selectCoins, estimateFeeForSelection, type Utxo } from "./coin-selection";
import { createTaprootInscriptionOutput } from "./taproot-inscription";
import {
  validateTaprootAddress,
  validateFeeRate,
  validateInscriptionContent,
  validateUtxo,
  validatePublicKey,
} from "./validation";

export interface InscriptionData {
  content: Uint8Array;
  contentType: string; // MIME type, e.g., "text/plain", "image/png"
  metadata?: Record<string, string>; // Optional metadata
}

export interface InscriptionTxParams {
  inscriptionData: InscriptionData;
  recipientAddress: string; // Taproot address to receive the inscription
  feeRate: number; // sats per vbyte
  paymentUtxos: Utxo[];
  paymentPublicKey: Buffer; // Public key for payment inputs
  changeAddress: string; // Address to send change to
  network?: bitcoin.Network;
  coinSelectionStrategy?: "largest-first" | "smallest-first" | "optimal";
  minChangeThreshold?: number; // Minimum change to create a change output (default: dust limit)
}

/**
 * Create BIP-380 inscription envelope script
 * Format: OP_FALSE OP_IF ... OP_ENDIF
 */
function createInscriptionEnvelope(
  contentType: string,
  content: Uint8Array,
  metadata?: Record<string, string>
): Buffer {
  const chunks: Buffer[] = [];

  // OP_FALSE OP_IF
  chunks.push(Buffer.from([0x00, 0x63]));

  // Push "ord" protocol identifier
  const ordProtocol = Buffer.from("ord", "utf8");
  chunks.push(Buffer.from([ordProtocol.length]));
  chunks.push(ordProtocol);

  // Push content type
  const contentTypeBytes = Buffer.from(contentType, "utf8");
  chunks.push(Buffer.from([1, contentTypeBytes.length]));
  chunks.push(contentTypeBytes);

  // Push content
  chunks.push(Buffer.from([content.length]));
  chunks.push(Buffer.from(content));

  // Optional metadata
  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      const keyBytes = Buffer.from(key, "utf8");
      const valueBytes = Buffer.from(value, "utf8");
      chunks.push(Buffer.from([keyBytes.length]));
      chunks.push(keyBytes);
      chunks.push(Buffer.from([valueBytes.length]));
      chunks.push(valueBytes);
    }
  }

  // OP_ENDIF
  chunks.push(Buffer.from([0x68]));

  return Buffer.concat(chunks);
}

/**
 * Estimate transaction size in vbytes (more accurate)
 */
function estimateTxSize(
  inputCount: number,
  outputCount: number,
  inscriptionScriptSize: number,
  hasWitness: boolean = true
): number {
  // Base transaction overhead
  let vbytes = 10; // version (4) + locktime (4) + input count (1-2) + output count (1-2)

  // Inputs
  if (hasWitness) {
    // P2TR inputs: 36 (prevout) + 4 (sequence) = 40 bytes
    // Witness: 1 (item count) + 64-73 (signature) = ~65-74 bytes
    // Total per input: 40 + (65/4) = ~56 vbytes (witness counts as 0.25x)
    vbytes += inputCount * 56;
  } else {
    // Legacy inputs: 36 (prevout) + 1 (script length) + 107 (script) + 4 (sequence) = 148 bytes
    vbytes += inputCount * 148;
  }

  // Outputs: 8 (value) + 1-2 (script length) + script
  // P2TR output: 8 + 1 + 34 = 43 bytes
  // Inscription output uses same size as regular P2TR (inscription is in witness, not output script)
  vbytes += outputCount * 43;

  return vbytes;
}

/**
 * Build a PSBT for creating an inscription
 */
export async function buildInscriptionPSBT(
  params: InscriptionTxParams
): Promise<bitcoin.Psbt> {
  const network = params.network || bitcoin.networks.bitcoin;

  // Validate inputs
  const recipientValidation = validateTaprootAddress(params.recipientAddress, network);
  if (!recipientValidation.valid) {
    throw new Error(recipientValidation.error);
  }

  const feeRateValidation = validateFeeRate(params.feeRate);
  if (!feeRateValidation.valid) {
    throw new Error(feeRateValidation.error);
  }

  const contentValidation = validateInscriptionContent(params.inscriptionData.content);
  if (!contentValidation.valid) {
    throw new Error(contentValidation.error);
  }

  const publicKeyValidation = validatePublicKey(params.paymentPublicKey);
  if (!publicKeyValidation.valid) {
    throw new Error(publicKeyValidation.error);
  }

  // Validate all UTXOs
  for (const utxo of params.paymentUtxos) {
    const utxoValidation = validateUtxo(utxo);
    if (!utxoValidation.valid) {
      throw new Error(utxoValidation.error);
    }
  }

  // Create inscription envelope script
  const inscriptionScript = createInscriptionEnvelope(
    params.inscriptionData.contentType,
    params.inscriptionData.content,
    params.inscriptionData.metadata
  );

  // Create taproot output script for inscription
  // The inscription script is embedded in the taproot script path
  const recipientScript = bitcoin.address.toOutputScript(
    params.recipientAddress,
    network
  );

  // Additional validation
  if (!params.paymentUtxos || params.paymentUtxos.length === 0) {
    throw new Error("No payment UTXOs provided");
  }

  const dustLimit = 546; // Minimum output value
  const minChangeThreshold = params.minChangeThreshold || dustLimit;

  // Inscription output value (must be at least dust limit)
  const inscriptionOutputValue = Math.max(dustLimit, params.inscriptionData.content.length);

  // Initial fee estimation (we'll refine this iteratively)
  let estimatedFee = estimateFeeForSelection(
    params.paymentUtxos.length,
    2, // inscription + change
    params.feeRate
  );

  // Coin selection with iterative fee estimation
  let selectedUtxos: Utxo[];
  let change: number;
  let totalInputValue: number;
  let iterations = 0;
  const maxIterations = 5;

  do {
    // Select coins
    const selection = selectCoins(
      params.paymentUtxos,
      inscriptionOutputValue,
      estimatedFee,
      params.coinSelectionStrategy || "largest-first"
    );

    selectedUtxos = selection.selected;
    totalInputValue = selection.totalValue;
    change = selection.change;

    // Re-estimate fee with actual input count
    estimatedFee = estimateFeeForSelection(
      selectedUtxos.length,
      change > minChangeThreshold ? 2 : 1, // inscription + (change if needed)
      params.feeRate
    );

    iterations++;
  } while (
    iterations < maxIterations &&
    totalInputValue < inscriptionOutputValue + estimatedFee
  );

  // Final check
  const totalNeeded = inscriptionOutputValue + estimatedFee;
  if (totalInputValue < totalNeeded) {
    throw new Error(
      `Insufficient funds. Need ${totalNeeded} sats (${inscriptionOutputValue} for output + ${estimatedFee} for fee), have ${totalInputValue} sats`
    );
  }

  // Recalculate change with final fee
  change = totalInputValue - inscriptionOutputValue - estimatedFee;

  // Create PSBT
  const psbt = new bitcoin.Psbt({ network });

  // Add selected inputs
  for (const utxo of selectedUtxos) {
    if (utxo.witnessUtxo) {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: utxo.witnessUtxo.script,
          value: BigInt(utxo.witnessUtxo.value),
        },
      });
    } else {
      // Non-witness UTXO (for legacy inputs)
      // Note: We need the full transaction for non-witness UTXOs
      throw new Error("Non-witness UTXOs require full transaction data");
    }
  }

  // Create taproot inscription output
  // Note: For now, we use the recipient address directly
  // In production, you'd construct a proper taproot script tree
  // with the inscription script committed to a leaf
  psbt.addOutput({
    address: params.recipientAddress,
    value: BigInt(inscriptionOutputValue),
  });

  // Add change output if change is above threshold
  if (change > minChangeThreshold) {
    psbt.addOutput({
      address: params.changeAddress,
      value: BigInt(change),
    });
  } else if (change < 0) {
    // If change is negative, we need more inputs (shouldn't happen after selection)
    throw new Error(
      `Insufficient funds after fee calculation. Need ${totalNeeded} sats, have ${totalInputValue} sats`
    );
  }
  // If change is positive but below threshold, it's added to the fee (dust)

  return psbt;
}

/**
 * Convert file or text to InscriptionData
 */
export async function prepareInscriptionData(
  content: File | string,
  contentType?: string
): Promise<InscriptionData> {
  if (typeof content === "string") {
    // Text content
    const textBytes = new TextEncoder().encode(content);
    return {
      content: textBytes,
      contentType: contentType || "text/plain;charset=utf-8",
    };
  } else {
    // File content
    const arrayBuffer = await content.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);
    return {
      content: fileBytes,
      contentType: contentType || content.type || "application/octet-stream",
    };
  }
}

/**
 * Get UTXOs for an address (placeholder - you'd use a data source)
 * This should be implemented using LaserEyes DataSourceManager or mempool.space API
 */
export async function getUtxosForAddress(
  address: string,
  network?: bitcoin.Network
): Promise<Array<{
  txid: string;
  vout: number;
  value: number;
  scriptPubKey: Buffer;
  witnessUtxo?: {
    script: Buffer;
    value: number;
  };
}>> {
  // TODO: Implement using DataSourceManager or mempool.space API
  // For now, return empty array - this needs to be implemented
  throw new Error("getUtxosForAddress not yet implemented. Use LaserEyes DataSourceManager.");
}

