"use client";

import { useLaserEyes } from "@omnisat/lasereyes-react";
import { useEffect, useState } from "react";
import { dataSourceManager } from "@/lib/bitcoin/lasereyes-config";
import type { WalletInfo } from "@/lib/bitcoin/types";

/**
 * Debug panel for development
 * Only visible when NODE_ENV is development
 */
export function WalletDebugPanel() {
  const { address, paymentAddress, connected, provider } = useLaserEyes();
  const [balance, setBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show in development
  const isDevelopment =
    typeof window !== "undefined" &&
    (process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost");

  if (!isDevelopment) {
    return null;
  }

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !connected) {
        setBalance(null);
        return;
      }

      try {
        setLoadingBalance(true);
        setError(null);
        // TODO: Use DataSourceManager to get balance
        setBalance(null); // Placeholder until DataSourceManager API is available
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch balance";
        setError(message);
        console.error("Failed to fetch balance:", err);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [address, connected]);

  const walletInfo: WalletInfo = {
    address,
    paymentAddress,
    connected,
    provider,
  };

  return (
    <div className="mt-4 modern-card p-4 border border-modern-warning bg-modern-warningLight">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-modern-warning">
          Debug Panel (Dev Only)
        </h3>
      </div>
      <div className="h-px bg-modern-border mb-3"></div>
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-modern-textDim">Provider: </span>
          <span className="text-modern-text font-medium">
            {provider || "Not connected"}
          </span>
        </div>
        <div>
          <span className="text-modern-textDim">Connected: </span>
          <span className="text-modern-text font-medium">
            {connected ? "Yes" : "No"}
          </span>
        </div>
        {address && (
          <div>
            <span className="text-modern-textDim">Address: </span>
            <span className="text-modern-text break-all text-xs font-mono">
              {address}
            </span>
          </div>
        )}
        {paymentAddress && (
          <div>
            <span className="text-modern-textDim">Payment Address: </span>
            <span className="text-modern-text break-all text-xs font-mono">
              {paymentAddress}
            </span>
          </div>
        )}
        {connected && address && (
          <div>
            <span className="text-modern-textDim">Balance: </span>
            {loadingBalance ? (
              <span className="text-modern-textDim">Loading...</span>
            ) : error ? (
              <span className="text-modern-error">{error}</span>
            ) : balance !== null ? (
              <span className="text-modern-text font-medium">{balance} sats</span>
            ) : (
              <span className="text-modern-textDim">
                Balance API not yet implemented
              </span>
            )}
          </div>
        )}
        <div className="pt-2 border-t border-modern-border">
          <p className="text-xs text-modern-textDim break-all font-mono">
            {JSON.stringify(walletInfo, null, 2)}
          </p>
        </div>
      </div>
    </div>
  );
}
