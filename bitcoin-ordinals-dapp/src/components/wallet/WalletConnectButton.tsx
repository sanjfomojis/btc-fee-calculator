"use client";

import { useLaserEyes } from "@omnisat/lasereyes-react";
import type { ProviderType } from "@omnisat/lasereyes-core";
import { useState } from "react";
import { DEFAULT_WALLETS, WALLET_NAMES } from "@/lib/bitcoin/lasereyes-config";

export function WalletConnectButton() {
  const { address, paymentAddress, connected, connect, disconnect, provider } =
    useLaserEyes();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWalletChooser, setShowWalletChooser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (wallet: ProviderType) => {
    try {
      setIsConnecting(true);
      setError(null);
      setShowWalletChooser(false);
      await connect(wallet);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      console.error("Failed to connect wallet:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setError(null);
    } catch (err) {
      console.error("Failed to disconnect wallet:", err);
    }
  };

  const shortenAddress = (addr: string | null) => {
    if (!addr) return "";
    if (addr.length <= 16) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  if (connected && address) {
    return (
      <div className="space-y-3">
        <div className="modern-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-modern-textDim mb-1">
                Connected
              </p>
              {provider && (
                <p className="text-base font-semibold text-modern-text">
                  {WALLET_NAMES[provider] || provider}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-4 py-2 text-sm font-medium text-modern-error bg-modern-errorLight border border-modern-error rounded-lg hover:bg-modern-errorLight/80 transition-colors cursor-pointer"
            >
              Disconnect
            </button>
          </div>
          <div className="h-px bg-modern-border"></div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-modern-textDim mb-1.5">
                Ordinal Address
              </p>
              <p className="text-sm font-mono text-modern-text break-all bg-modern-surfaceHover p-2 rounded-md">
                {address}
              </p>
              <p className="text-xs font-mono text-modern-textDim mt-1.5">
                {shortenAddress(address)}
              </p>
            </div>
            {paymentAddress && paymentAddress !== address && (
              <>
                <div className="h-px bg-modern-border"></div>
                <div>
                  <p className="text-xs font-medium text-modern-textDim mb-1.5">
                    Payment Address
                  </p>
                  <p className="text-sm font-mono text-modern-text break-all bg-modern-surfaceHover p-2 rounded-md">
                    {paymentAddress}
                  </p>
                  <p className="text-xs font-mono text-modern-textDim mt-1.5">
                    {shortenAddress(paymentAddress)}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        {error && (
          <div className="modern-card p-4 border border-modern-error bg-modern-errorLight">
            <p className="text-sm text-modern-error">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setShowWalletChooser(true)}
        disabled={isConnecting}
        className="modern-button w-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </button>

      {error && (
        <div className="modern-card p-4 border border-modern-error bg-modern-errorLight">
          <p className="text-sm text-modern-error">{error}</p>
        </div>
      )}

      {/* Wallet Chooser Dialog */}
      {showWalletChooser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="modern-card max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-modern-text">
                Select Wallet
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowWalletChooser(false);
                  setError(null);
                }}
                className="text-modern-textDim hover:text-modern-text transition-colors cursor-pointer p-1 hover:bg-modern-surfaceHover rounded-md"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              {DEFAULT_WALLETS.map((wallet) => (
                <button
                  type="button"
                  key={wallet}
                  onClick={() => handleConnect(wallet)}
                  disabled={isConnecting}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-modern-text bg-modern-surfaceHover hover:bg-modern-borderLight rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group cursor-pointer"
                >
                  <span>{WALLET_NAMES[wallet] || wallet}</span>
                  <span className="text-modern-textDim group-hover:text-modern-accent transition-colors">
                    →
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-modern-border">
              <p className="text-xs text-modern-textDim text-center">
                Make sure your wallet extension is installed and unlocked
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
