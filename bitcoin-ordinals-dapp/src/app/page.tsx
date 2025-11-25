"use client";

import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import { WalletDebugPanel } from "@/components/wallet/WalletDebugPanel";
import { InscriptionForm } from "@/components/inscriptions/InscriptionForm";
import { InscriptionStatus } from "@/components/inscriptions/InscriptionStatus";
import { InscriptionPaymentStep } from "@/components/inscriptions/InscriptionPaymentStep";
import { useState } from "react";

export default function Home() {
  const [inscriptionStatus, setInscriptionStatus] = useState<string>(
    "Ready to create inscription"
  );
  const [txid, setTxid] = useState<string | null>(null);
  const [feeRate, setFeeRate] = useState<number>(10);

  const handleTxCreated = (id: string, rate: number) => {
    setTxid(id);
    setFeeRate(rate);
  };

  const handleStatusChange = (status: string) => {
    setInscriptionStatus(status);
  };

  return (
    <main className="min-h-screen bg-modern-bg">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold text-modern-text tracking-tight">
              Bitcoin Ordinals Inscription Tool
            </h1>
            <p className="text-lg text-modern-textDim">
              Create and inscribe content on Bitcoin
            </p>
          </div>

          {/* Main Card */}
          <div className="modern-card p-8 space-y-8">
            {/* Wallet Connection */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-modern-text mb-1">
                  Wallet Connection
                </h2>
                <p className="text-sm text-modern-textDim">
                  Connect your Bitcoin wallet to get started
                </p>
              </div>
              <WalletConnectButton />
              <WalletDebugPanel />
            </div>

            <div className="divider"></div>

            {/* Inscription Form */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-modern-text mb-1">
                  Inscription Details
                </h2>
                <p className="text-sm text-modern-textDim">
                  Upload a file or enter text to inscribe
                </p>
              </div>
              <InscriptionForm
                onTxCreated={handleTxCreated}
                onStatusChange={handleStatusChange}
              />
            </div>

            <div className="divider"></div>

            {/* Status Display */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-modern-text mb-1">
                  Status
                </h2>
                <p className="text-sm text-modern-textDim">
                  Track your inscription progress
                </p>
              </div>
              <InscriptionStatus txid={txid} status={inscriptionStatus} />
            </div>

          </div>

          {/* Footer */}
          <div className="text-center pt-8">
            <p className="text-sm text-modern-textDim">
              Direct Bitcoin inscription builder
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
