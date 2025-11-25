"use client";

import { useState } from "react";
import { useLaserEyes } from "@omnisat/lasereyes-react";
import { buildInscriptionTransaction, signAndBroadcastInscription } from "@/lib/bitcoin/transaction-builder";
import { dataSourceManager } from "@/lib/bitcoin/lasereyes-config";
import * as bitcoin from "bitcoinjs-lib";

interface InscriptionFormProps {
  onTxCreated: (txid: string, feeRate: number) => void;
  onStatusChange: (status: string) => void;
}

export function InscriptionForm({
  onTxCreated,
  onStatusChange,
}: InscriptionFormProps) {
  const { address, paymentAddress, publicKey, paymentPublicKey, signPsbt, network } = useLaserEyes();

  // Tab state
  const [tab, setTab] = useState<"file" | "text">("file");

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [feeRate, setFeeRate] = useState(10);
  const [postage, setPostage] = useState(546); // Minimum output value

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setText(""); // Clear text when file is selected
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!address || !paymentAddress) {
      setError("Connect a wallet to inscribe");
      return;
    }

    if (!publicKey || !paymentPublicKey) {
      setError("Public keys not available from wallet");
      return;
    }

    if (tab === "file" && !file) {
      setError("Please select a file");
      return;
    }

    if (tab === "text" && !text.trim()) {
      setError("Please enter text content");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      onStatusChange("Building inscription transaction...");

      // Determine network
      const bitcoinNetwork =
        network === "mainnet"
          ? bitcoin.networks.bitcoin
          : bitcoin.networks.testnet;

      // Build transaction
      const content = tab === "file" && file ? file : text;
      const contentType =
        tab === "file" && file ? file.type : "text/plain;charset=utf-8";

      onStatusChange("Fetching UTXOs...");
      const { psbt, estimatedFee, inscriptionData } = await buildInscriptionTransaction({
        content,
        contentType,
        recipientAddress: address, // Inscription goes to ordinal address
        feeRate,
        paymentAddress: paymentAddress, // Pay from payment address
        paymentPublicKey: paymentPublicKey,
        changeAddress: paymentAddress, // Change goes back to payment address
        network: bitcoinNetwork,
        dataSourceManager,
      });

      onStatusChange(`Transaction built. Estimated fee: ${estimatedFee} sats. Signing...`);

      // Sign and broadcast
      const txid = await signAndBroadcastInscription(psbt, signPsbt);

      // Save to database (optional, won't fail if DB is not available)
      try {
        await fetch("/api/inscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txid,
            recipient_address: address,
            content_type: inscriptionData.contentType,
            content_size: inscriptionData.content.length,
            fee_rate: feeRate,
            fee_paid: estimatedFee,
            network: network || "mainnet",
          }),
        });
      } catch (dbError) {
        console.warn("Failed to save to database:", dbError);
        // Don't fail the transaction if DB save fails
      }

      // Success
      onTxCreated(txid, feeRate);
      onStatusChange(`Transaction broadcast: ${txid}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(message);
      onStatusChange(`Error: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Wallet Connection Check */}
      {!address || !paymentAddress ? (
        <div className="modern-card p-4 border border-modern-warning bg-modern-warningLight">
          <p className="text-sm font-medium text-modern-warning">
            Connect a wallet to inscribe
          </p>
        </div>
      ) : null}

      {/* Tab Toggle */}
      <div className="flex space-x-2">
        <button
          type="button"
          onClick={() => {
            setTab("file");
            setText("");
            setError(null);
          }}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            tab === "file"
              ? "text-modern-accent bg-modern-accentLight border-2 border-modern-accent"
              : "text-modern-textDim bg-modern-surfaceHover border-2 border-transparent hover:border-modern-border"
          }`}
        >
          File
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("text");
            setFile(null);
            setError(null);
          }}
          className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            tab === "text"
              ? "text-modern-accent bg-modern-accentLight border-2 border-modern-accent"
              : "text-modern-textDim bg-modern-surfaceHover border-2 border-transparent hover:border-modern-border"
          }`}
        >
          Text
        </button>
      </div>

      {/* File Upload Tab */}
      {tab === "file" && (
        <div>
          <label className="block text-sm font-medium text-modern-text mb-2">
            Upload File
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={!address || isSubmitting}
            accept="image/*,text/plain,application/json"
            className="modern-input w-full px-4 py-3 text-sm text-modern-text disabled:opacity-50 disabled:cursor-not-allowed file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-modern-accent file:text-white hover:file:bg-modern-accentHover file:cursor-pointer"
          />
          {file && (
            <div className="mt-3 modern-card p-3 bg-modern-surfaceHover">
              <p className="text-sm text-modern-text">
                <span className="font-semibold">{file.name}</span>
                <span className="text-modern-textDim ml-2">
                  ({(file.size / 1024).toFixed(2)} KB)
                </span>
              </p>
              <p className="text-xs text-modern-textDim mt-1">{file.type}</p>
            </div>
          )}
        </div>
      )}

      {/* Text Input Tab */}
      {tab === "text" && (
        <div>
          <label className="block text-sm font-medium text-modern-text mb-2">
            Enter Text Content
          </label>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            disabled={!address || isSubmitting}
            placeholder="Enter your text content here..."
            rows={6}
            className="modern-input w-full px-4 py-3 text-sm text-modern-text placeholder-modern-textLight disabled:opacity-50 disabled:cursor-not-allowed resize-none"
          />
          <div className="mt-2 flex justify-end">
            <p className="text-xs text-modern-textDim">
              {text.length} character{text.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      {/* Fee Rate */}
      <div>
        <label className="block text-sm font-medium text-modern-text mb-2">
          Fee Rate: <span className="text-modern-accent">{feeRate}</span> sats/vB
        </label>
        <input
          type="range"
          min="1"
          max="100"
          value={feeRate}
          onChange={(e) => setFeeRate(Number(e.target.value))}
          disabled={isSubmitting}
          className="w-full h-2 bg-modern-borderLight rounded-lg appearance-none cursor-pointer accent-modern-accent disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-modern-textDim mt-1">
          <span>1</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      {/* Postage (Minimum Output Value) */}
      <div>
        <label className="block text-sm font-medium text-modern-text mb-2">
          Inscription Output Value (sats)
        </label>
        <input
          type="number"
          min="546"
          value={postage}
          onChange={(e) => setPostage(Number(e.target.value))}
          disabled={isSubmitting}
          className="modern-input w-full px-4 py-3 text-sm text-modern-text disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <p className="mt-2 text-xs text-modern-textDim">
          Minimum: 546 sats (dust limit). This is the value locked in the inscription output.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="modern-card p-4 border border-modern-error bg-modern-errorLight">
          <p className="text-sm text-modern-error font-medium">{error}</p>
        </div>
      )}

      {/* Inscribe Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={
          !address ||
          !paymentAddress ||
          isSubmitting ||
          (tab === "file" && !file) ||
          (tab === "text" && !text.trim())
        }
        className="modern-button w-full px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        {isSubmitting ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
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
            <span>Creating Inscription...</span>
          </>
        ) : (
          <span>Create Inscription</span>
        )}
      </button>
    </div>
  );
}
