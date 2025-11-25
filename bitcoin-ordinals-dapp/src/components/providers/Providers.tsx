"use client";

import { useMemo } from "react";
import { LaserEyesProvider } from "@omnisat/lasereyes-react";
import { getLaserEyesConfig } from "@/lib/bitcoin/lasereyes-config";

export function Providers({ children }: { children: React.ReactNode }) {
  // Memoize config to prevent re-creating on every render
  const config = useMemo(() => getLaserEyesConfig(), []);
  
  return <LaserEyesProvider config={config}>{children}</LaserEyesProvider>;
}

