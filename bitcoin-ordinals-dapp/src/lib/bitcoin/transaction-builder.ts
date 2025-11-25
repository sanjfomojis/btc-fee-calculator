/**
 * Direct Transaction Builder for Bitcoin Inscriptions
 * 
 * This module handles building inscription transactions without external APIs.
 * It integrates with LaserEyes for wallet signing and UTXO management.
 */

import { buildInscriptionPSBT, prepareInscriptionData, type InscriptionData } from "./inscription-builder";
import * as bitcoin from "bitcoinjs-lib";
import { broadcastRawTxViaMempool } from "./broadcast";
import { validateTaprootAddress, validateFeeRate } from "./validation";

export interface BuildInscriptionTxParams {
  content: File | string;
  contentType?: string;
  recipientAddress: string;
  feeRate: number; // sats per vbyte
  paymentAddress: string; // Address with UTXOs to spend from
  paymentPublicKey: string; // Public key for payment inputs
  changeAddress: string;
  network?: bitcoin.Network;
  dataSourceManager?: any; // Optional LaserEyes DataSourceManager
}

/**
 * Build and prepare an inscription transaction
 * Returns a PSBT ready for signing
 */
export async function buildInscriptionTransaction(
  params: BuildInscriptionTxParams
): Promise<{
  psbt: bitcoin.Psbt;
  estimatedFee: number;
  inscriptionData: InscriptionData;
  actualFee: number;
}> {
  // Validate inputs
  const recipientValidation = validateTaprootAddress(
    params.recipientAddress,
    params.network
  );
  if (!recipientValidation.valid) {
    throw new Error(recipientValidation.error);
  }

  const paymentValidation = validateTaprootAddress(
    params.paymentAddress,
    params.network
  );
  if (!paymentValidation.valid) {
    throw new Error(`Invalid payment address: ${paymentValidation.error}`);
  }

  const changeValidation = validateTaprootAddress(
    params.changeAddress,
    params.network
  );
  if (!changeValidation.valid) {
    throw new Error(`Invalid change address: ${changeValidation.error}`);
  }

  const feeRateValidation = validateFeeRate(params.feeRate);
  if (!feeRateValidation.valid) {
    throw new Error(feeRateValidation.error);
  }

  // Prepare inscription data
  const inscriptionData = await prepareInscriptionData(
    params.content,
    params.contentType
  );

  // Get UTXOs for payment address
  const utxos = await getUtxosForPayment(
    params.paymentAddress,
    params.dataSourceManager
  );

  if (utxos.length === 0) {
    throw new Error(
      `No UTXOs found for address ${params.paymentAddress}. Please ensure you have sufficient funds.`
    );
  }

  // Convert payment public key to Buffer
  let paymentPublicKeyBuffer: Buffer;
  if (typeof params.paymentPublicKey === "string") {
    paymentPublicKeyBuffer = Buffer.from(params.paymentPublicKey, "hex");
  } else {
    paymentPublicKeyBuffer = params.paymentPublicKey;
  }

  // Build PSBT
  const psbt = await buildInscriptionPSBT({
    inscriptionData,
    recipientAddress: params.recipientAddress,
    feeRate: params.feeRate,
    paymentUtxos: utxos,
    paymentPublicKey: paymentPublicKeyBuffer,
    changeAddress: params.changeAddress,
    network: params.network,
  });

  // Calculate actual fee from the built transaction
  const tx = psbt.extractTransaction(true);
  const actualSize = tx.virtualSize();
  const actualFee = actualSize * params.feeRate;

  return {
    psbt,
    estimatedFee: actualFee, // Use actual fee from built transaction
    actualFee,
    inscriptionData,
  };
}

/**
 * Get UTXOs for payment using LaserEyes DataSourceManager
 */
async function getUtxosForPayment(
  address: string,
  dataSourceManager?: any // LaserEyes DataSourceManager
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
  // If DataSourceManager is provided, use it
  if (dataSourceManager && typeof dataSourceManager.getUtxos === "function") {
    try {
      const utxos = await dataSourceManager.getUtxos(address);
      return utxos.map((utxo: any) => ({
        txid: utxo.txid,
        vout: utxo.vout || utxo.index || 0,
        value: utxo.value || utxo.amount || 0,
        scriptPubKey: Buffer.from(utxo.scriptPubKey || utxo.script, "hex"),
        witnessUtxo: utxo.witnessUtxo
          ? {
              script: Buffer.from(utxo.witnessUtxo.script, "hex"),
              value: utxo.witnessUtxo.value || utxo.value || 0,
            }
          : undefined,
      }));
    } catch (error) {
      console.error("Failed to fetch UTXOs from DataSourceManager:", error);
    }
  }

  // Fallback: Use mempool.space API directly
  try {
    const network = process.env.NEXT_PUBLIC_NETWORK || "mainnet";
    const baseUrl =
      network === "testnet"
        ? "https://mempool.space/testnet/api"
        : "https://mempool.space/api";

    const response = await fetch(`${baseUrl}/address/${address}/utxo`);
    if (!response.ok) {
      throw new Error(`Failed to fetch UTXOs: ${response.statusText}`);
    }

    const utxos = await response.json();
    return utxos.map((utxo: any) => ({
      txid: utxo.txid,
      vout: utxo.vout,
      value: utxo.value,
      scriptPubKey: Buffer.from(utxo.scriptpubkey, "hex"),
      witnessUtxo: {
        script: Buffer.from(utxo.scriptpubkey, "hex"),
        value: utxo.value,
      },
    }));
  } catch (error) {
    console.error("Failed to fetch UTXOs from mempool.space:", error);
    throw new Error(
      `Failed to fetch UTXOs for address ${address}. Please ensure you have sufficient funds.`
    );
  }
}

/**
 * Sign and broadcast an inscription transaction
 */
export async function signAndBroadcastInscription(
  psbt: bitcoin.Psbt,
  signPsbt: (psbtBase64: string) => Promise<unknown>
): Promise<string> {
  // Convert PSBT to base64
  const psbtBase64 = psbt.toBase64();

  // Sign with wallet
  const signedResult = await signPsbt(psbtBase64);

  // Handle signed PSBT result
  let finalTx: bitcoin.Transaction;
  
  if (typeof signedResult === "string") {
    // If it's a string, try to parse it as base64 PSBT or hex transaction
    try {
      const signedPsbt = bitcoin.Psbt.fromBase64(signedResult);
      signedPsbt.finalizeAllInputs();
      finalTx = signedPsbt.extractTransaction();
    } catch {
      // Try as hex transaction
      try {
        finalTx = bitcoin.Transaction.fromHex(signedResult);
      } catch {
        throw new Error("Invalid signed transaction format");
      }
    }
  } else {
    throw new Error("Unexpected signed transaction format");
  }

  // Broadcast transaction
  const txid = await broadcastRawTxViaMempool(finalTx.toHex());

  return txid;
}

