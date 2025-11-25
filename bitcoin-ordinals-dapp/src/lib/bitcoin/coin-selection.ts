/**
 * Coin Selection Algorithm
 * 
 * Implements UTXO selection strategies for building transactions.
 * Supports largest-first, smallest-first, and optimal selection.
 */

export interface Utxo {
  txid: string;
  vout: number;
  value: number; // in sats
  scriptPubKey: Buffer;
  witnessUtxo?: {
    script: Buffer;
    value: number;
  };
}

export type CoinSelectionStrategy = "largest-first" | "smallest-first" | "optimal";

/**
 * Select UTXOs to cover the required amount plus fees
 * 
 * @param utxos - Available UTXOs
 * @param targetAmount - Amount needed (in sats)
 * @param estimatedFee - Estimated fee (in sats)
 * @param strategy - Selection strategy
 * @returns Selected UTXOs and change amount
 */
export function selectCoins(
  utxos: Utxo[],
  targetAmount: number,
  estimatedFee: number,
  strategy: CoinSelectionStrategy = "largest-first"
): {
  selected: Utxo[];
  change: number;
  totalValue: number;
} {
  if (utxos.length === 0) {
    throw new Error("No UTXOs available");
  }

  // Sort UTXOs based on strategy
  const sorted = [...utxos].sort((a, b) => {
    switch (strategy) {
      case "largest-first":
        return b.value - a.value;
      case "smallest-first":
        return a.value - b.value;
      case "optimal":
        // For optimal, we'll use largest-first as a simple heuristic
        // A more sophisticated approach would use dynamic programming
        return b.value - a.value;
      default:
        return b.value - a.value;
    }
  });

  // Calculate total needed
  const totalNeeded = targetAmount + estimatedFee;

  // Select UTXOs until we have enough
  const selected: Utxo[] = [];
  let totalValue = 0;

  for (const utxo of sorted) {
    selected.push(utxo);
    totalValue += utxo.value;

    if (totalValue >= totalNeeded) {
      break;
    }
  }

  // Check if we have enough
  if (totalValue < totalNeeded) {
    throw new Error(
      `Insufficient funds. Need ${totalNeeded} sats, have ${totalValue} sats`
    );
  }

  // Calculate change
  const change = totalValue - totalNeeded;

  return {
    selected,
    change,
    totalValue,
  };
}

/**
 * Estimate fee for a transaction with given inputs and outputs
 * This is a more accurate estimation that accounts for actual sizes
 */
export function estimateFeeForSelection(
  inputCount: number,
  outputCount: number,
  feeRate: number, // sats per vbyte
  hasWitness: boolean = true
): number {
  // Base transaction overhead
  let vbytes = 10; // version (4) + locktime (4) + input count (1-2) + output count (1-2)

  // Inputs
  if (hasWitness) {
    // P2TR inputs: 36 (prevout) + 4 (sequence) + 1 (witness item count) = 41 bytes
    // Witness: 1 (item count) + 64-73 (signature) = ~65-74 bytes
    // Total per input: 41 + (65/4) = ~57 vbytes
    vbytes += inputCount * 57;
  } else {
    // Legacy inputs: 36 (prevout) + 1 (script length) + 107 (script) + 4 (sequence) = 148 bytes
    vbytes += inputCount * 148;
  }

  // Outputs: 8 (value) + 1-2 (script length) + script
  // P2TR output: 8 + 1 + 34 = 43 bytes
  vbytes += outputCount * 43;

  return Math.ceil(vbytes * feeRate);
}

