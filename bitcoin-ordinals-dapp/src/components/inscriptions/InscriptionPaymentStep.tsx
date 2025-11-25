"use client";

import { useState, useEffect } from "react";
import { useLaserEyes } from "@omnisat/lasereyes-react";
import {
  getFundingInfo,
  createSpecialSatsPsbt,
  type FundingInfo,
} from "@/lib/bitcoin/ordinalsbot";
import { broadcastRawTxViaMempool } from "@/lib/bitcoin/broadcast";

interface InscriptionPaymentStepProps {
  orderId: string;
  feeRate: number;
  onTxBroadcast?: (txid: string) => void;
  onError?: (error: string) => void;
}

type PaymentStep =
  | "idle"
  | "loading_order"
  | "building_psbt"
  | "awaiting_signature"
  | "broadcasting"
  | "done"
  | "error";

export function InscriptionPaymentStep({
  orderId,
  feeRate,
  onTxBroadcast,
  onError,
}: InscriptionPaymentStepProps) {
  const { address, paymentAddress, signPsbt, publicKey, paymentPublicKey } =
    useLaserEyes();

  const [step, setStep] = useState<PaymentStep>("idle");
  const [fundingInfo, setFundingInfo] = useState<FundingInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txid, setTxid] = useState<string | null>(null);
  const [psbtBase64, setPsbtBase64] = useState<string | null>(null);

  // Fetch funding info when component mounts or orderId changes
  useEffect(() => {
    if (orderId && step === "idle") {
      loadFundingInfo();
    }
  }, [orderId]);

  const loadFundingInfo = async () => {
    try {
      setStep("loading_order");
      setError(null);

      const info = await getFundingInfo(orderId);
      setFundingInfo(info);

      if (!info.fundingAddress || !info.chargeAmount) {
        setStep("idle");
        // Don't set error, just wait for user to retry
        return;
      }

      // Funding info is ready, can proceed to build PSBT
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load order info";
      setError(message);
      setStep("error");
      onError?.(message);
    }
  };

  const handlePayAndSign = async () => {
    if (!address || !paymentAddress) {
      setError("Wallet not connected");
      setStep("error");
      return;
    }

    if (!publicKey || !paymentPublicKey) {
      setError("Public keys not available from wallet. Please reconnect your wallet.");
      setStep("error");
      return;
    }

    if (!fundingInfo?.fundingAddress || !fundingInfo?.chargeAmount) {
      setError("Funding information not available");
      setStep("error");
      return;
    }

    try {
      // Step 1: Build PSBT
      setStep("building_psbt");
      setError(null);

      // Use public keys directly from LaserEyes hook
      // publicKey = ordinal/taproot address public key
      // paymentPublicKey = payment address public key
      const psbtResponse = await createSpecialSatsPsbt({
        chargeAmount: fundingInfo.chargeAmount,
        fundingAddress: fundingInfo.fundingAddress,
        paymentAddress: paymentAddress,
        paymentPublicKey: paymentPublicKey, // From LaserEyes useLaserEyes().paymentPublicKey
        ordinalAddress: address,
        ordinalPublicKey: publicKey, // From LaserEyes useLaserEyes().publicKey
        feeRate: feeRate,
      });

      setPsbtBase64(psbtResponse.psbtBase64);

      // Step 2: Sign PSBT
      setStep("awaiting_signature");

      // LaserEyes signPsbt expects base64 PSBT
      // The return type should be a string (signed PSBT or final transaction hex)
      const signedPsbtResult: unknown = await signPsbt(psbtResponse.psbtBase64);

      // Step 3: Convert signed PSBT to raw transaction hex
      // LaserEyes signPsbt may return:
      // - A signed PSBT (base64) that needs finalization
      // - A final transaction hex (already finalized)
      // TODO: Check LaserEyes API documentation for exact return type
      // TODO: If it returns a PSBT, we need to finalize it using a PSBT library
      let rawTxHex: string;

      // Type guard: ensure we have a string
      if (typeof signedPsbtResult !== "string") {
        throw new Error("Unexpected signed PSBT format from LaserEyes");
      }

      // Check if it's already hex (long string without base64 padding)
      // Hex strings are typically longer and don't contain '=' padding
      const signedPsbtStr: string = signedPsbtResult;
      if (signedPsbtStr.length > 100 && !signedPsbtStr.includes("=")) {
        // Looks like hex, use it directly
        rawTxHex = signedPsbtStr;
      } else {
        // It's likely a base64 PSBT that needs finalization
        // TODO: Use a PSBT library to finalize (e.g., bitcoinjs-lib)
        // For now, we'll need to implement PSBT finalization
        throw new Error(
          "PSBT finalization required. The signed PSBT needs to be finalized to a raw transaction. TODO: Implement PSBT finalization using a library like bitcoinjs-lib."
        );
      }

      // Step 4: Broadcast transaction
      setStep("broadcasting");

      const broadcastTxid = await broadcastRawTxViaMempool(rawTxHex);
      setTxid(broadcastTxid);
      setStep("done");
      onTxBroadcast?.(broadcastTxid);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Payment flow failed";
      setError(message);
      setStep("error");
      onError?.(message);
    }
  };

  const chargeAmountBTC =
    fundingInfo?.chargeAmount
      ? (fundingInfo.chargeAmount / 100000000).toFixed(8)
      : "0";

  return (
    <div className="modern-card p-5 space-y-5">
      {/* Funding Information Display */}
      {fundingInfo && (
        <div className="space-y-3 p-4 bg-modern-accentLight rounded-lg border border-modern-accent/20">
          <div>
            <p className="text-xs font-medium text-modern-textDim mb-1.5">
              Funding Address
            </p>
            <p className="text-sm font-mono text-modern-text break-all bg-modern-surface p-2 rounded-md">
              {fundingInfo.fundingAddress || "Waiting..."}
            </p>
          </div>
          {fundingInfo.chargeAmount && (
            <div>
              <p className="text-xs font-medium text-modern-textDim mb-1.5">
                Charge Amount
              </p>
              <p className="text-lg font-semibold text-modern-text">
                {fundingInfo.chargeAmount.toLocaleString()} sats
              </p>
              <p className="text-sm text-modern-textDim">
                ≈ {chargeAmountBTC} BTC
              </p>
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      <div className="space-y-3">
        {step === "idle" && !fundingInfo?.fundingAddress && (
          <div className="modern-card p-4 border border-modern-warning bg-modern-warningLight">
            <p className="text-sm font-medium text-modern-warning mb-3">
              Waiting for OrdinalsBot to generate funding address...
            </p>
            <button
              type="button"
              onClick={loadFundingInfo}
              className="px-4 py-2 text-sm font-medium text-modern-warning bg-modern-warningLight border border-modern-warning rounded-lg hover:bg-modern-warningLight/80 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {step === "loading_order" && (
          <div className="flex items-center space-x-2 text-sm text-modern-textDim">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading order information...</span>
          </div>
        )}

        {step === "building_psbt" && (
          <div className="flex items-center space-x-2 text-sm text-modern-textDim">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Building PSBT...</span>
          </div>
        )}

        {step === "awaiting_signature" && (
          <div className="modern-card p-4 border border-modern-accent bg-modern-accentLight">
            <p className="text-sm font-medium text-modern-accent">
              Please approve the transaction in your wallet
            </p>
          </div>
        )}

        {step === "broadcasting" && (
          <div className="flex items-center space-x-2 text-sm text-modern-textDim">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Broadcasting transaction...</span>
          </div>
        )}

        {step === "done" && txid && (
          <div className="modern-card p-4 border border-modern-success bg-modern-successLight">
            <p className="text-sm font-semibold text-modern-success mb-3">
              ✓ Transaction broadcast successfully!
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-modern-textDim">Transaction ID</p>
              <p className="text-sm font-mono text-modern-text break-all bg-modern-surface p-2 rounded-md">
                {txid}
              </p>
              <a
                href={`https://mempool.space/tx/${txid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-modern-accent hover:text-modern-accentHover font-medium transition-colors"
              >
                View on mempool.space
                <svg
                  className="w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="modern-card p-4 border border-modern-error bg-modern-errorLight">
          <p className="text-sm text-modern-error font-medium">{error}</p>
        </div>
      )}

      {/* Safety Warnings */}
      <div className="modern-card p-4 border border-modern-warning bg-modern-warningLight space-y-2">
        <p className="text-xs font-semibold text-modern-warning">
          ⚠️ Important Warnings
        </p>
        <ul className="text-xs text-modern-text space-y-1.5 list-disc list-inside">
          <li>Always double-check PSBT details in your wallet before signing</li>
          <li>This tool is experimental; use at your own risk</li>
          <li>Verify the funding address and amount before proceeding</li>
        </ul>
      </div>

      {/* Action Button */}
      {fundingInfo?.fundingAddress &&
        fundingInfo?.chargeAmount &&
        step !== "done" &&
        step !== "awaiting_signature" &&
        step !== "broadcasting" && (
          <button
            type="button"
            onClick={handlePayAndSign}
            disabled={step === "loading_order" || step === "building_psbt"}
            className="modern-button w-full px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {step === "building_psbt"
              ? "Building PSBT..."
              : "Pay & Sign with Wallet"}
          </button>
        )}
    </div>
  );
}
