"use client";

interface InscriptionStatusProps {
  txid: string | null;
  status: string;
}

export function InscriptionStatus({
  txid,
  status,
}: InscriptionStatusProps) {
  if (!txid && status === "Ready to create inscription") {
    return (
      <div className="modern-card p-5">
        <p className="text-sm text-modern-textDim">
          No active inscription. Create an inscription to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="modern-card p-5 space-y-4">
      {/* Status Message */}
      <div>
        <p className="text-xs font-medium text-modern-textDim mb-1.5">
          Status
        </p>
        <p className="text-sm text-modern-text font-medium">{status}</p>
      </div>

      {/* Transaction ID */}
      {txid && (
        <>
          <div className="h-px bg-modern-border"></div>
          <div>
            <p className="text-xs font-medium text-modern-textDim mb-1.5">
              Transaction ID
            </p>
            <p className="text-sm font-mono text-modern-text break-all bg-modern-surfaceHover p-2.5 rounded-md">
              {txid}
            </p>
            <a
              href={`https://mempool.space/tx/${txid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-modern-accent hover:text-modern-accentHover font-medium transition-colors mt-2"
            >
              View on mempool.space
              <svg
                className="w-3 h-3 ml-1"
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
        </>
      )}

      {/* Info */}
      <div className="h-px bg-modern-border"></div>
      <div>
        <p className="text-xs font-medium text-modern-textDim mb-2">
          How it works
        </p>
        <ul className="text-sm text-modern-text space-y-2">
          <li className="flex items-start">
            <span className="text-modern-accent mr-2 mt-0.5">•</span>
            <span>Transaction is built locally with your content</span>
          </li>
          <li className="flex items-start">
            <span className="text-modern-accent mr-2 mt-0.5">•</span>
            <span>UTXOs are fetched from mempool.space</span>
          </li>
          <li className="flex items-start">
            <span className="text-modern-accent mr-2 mt-0.5">•</span>
            <span>You sign the transaction with your wallet</span>
          </li>
          <li className="flex items-start">
            <span className="text-modern-accent mr-2 mt-0.5">•</span>
            <span>Transaction is broadcast directly to Bitcoin network</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
