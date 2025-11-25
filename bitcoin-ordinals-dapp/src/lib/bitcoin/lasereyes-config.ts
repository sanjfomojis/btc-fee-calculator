import {
  MAINNET,
  TESTNET,
  UNISAT,
  XVERSE,
  LEATHER,
  MAGIC_EDEN,
  OYL,
  ORANGE,
  WIZZ,
  OKX,
  PHANTOM,
  DataSourceManager,
} from "@omnisat/lasereyes-core";
import { env } from "@/env";

/**
 * Default wallets to support in the wallet chooser
 * Add or remove wallets as needed
 */
export const DEFAULT_WALLETS = [
  UNISAT,
  XVERSE,
  LEATHER,
  MAGIC_EDEN,
  OYL,
  ORANGE,
  WIZZ,
  OKX,
  PHANTOM,
] as const;

/**
 * Wallet display names for UI
 */
export const WALLET_NAMES: Record<string, string> = {
  [UNISAT]: "UniSat",
  [XVERSE]: "Xverse",
  [LEATHER]: "Leather",
  [MAGIC_EDEN]: "Magic Eden",
  [OYL]: "OYL",
  [ORANGE]: "Orange",
  [WIZZ]: "Wizz",
  [OKX]: "OKX",
  [PHANTOM]: "Phantom",
};

/**
 * Configure LaserEyes DataSourceManager with available data providers
 * 
 * Data Sources (in priority order):
 * 1. Maestro - https://www.oklink.com/en/maestro (requires API key)
 * 2. Sandshrew - https://sandshrew.io (requires API key)
 * 3. Mempool.space - https://mempool.space (public, no API key needed)
 * 
 * The DataSourceManager will try sources in order until one responds.
 */
function createDataSourceManager(): DataSourceManager {
  // Initialize DataSourceManager if not already initialized
  // This is safe to call multiple times
  const network = env.BITCOIN_NETWORK || env.NEXT_PUBLIC_NETWORK || "mainnet";
  const isMainnet = network === "mainnet";
  
  DataSourceManager.init({
    network: isMainnet ? MAINNET : TESTNET,
  });

  const manager = DataSourceManager.getInstance();

  // Data sources can be configured here if needed
  // Option 1: Maestro (recommended for development and production)
  // Maestro provides fast, reliable Bitcoin data
  // Get API key: https://www.oklink.com/en/maestro
  // Example configuration (requires proper MaestroConfig structure):
  // if (env.MAESTRO_API_KEY) {
  //   const maestroSource = new MaestroDataSource(
  //     isMainnet ? MAINNET : TESTNET,
  //     { networks: { mainnet: { apiUrl: "...", apiKey: env.MAESTRO_API_KEY } } }
  //   );
  //   manager.registerDataSource("maestro", maestroSource);
  // }

  // Option 2: Sandshrew
  // Sandshrew is another reliable Bitcoin data provider
  // Get API key: https://sandshrew.io
  // Similar configuration pattern as Maestro

  // Option 3: Mempool.space (fallback - default)
  // Mempool.space is a public API, no key required
  // It's automatically used as a fallback by LaserEyes
  // API: https://mempool.space/api

  return manager;
}

/**
 * Get LaserEyes configuration based on environment variables
 * 
 * Reads:
 * - BITCOIN_NETWORK or NEXT_PUBLIC_NETWORK (default: "mainnet")
 * - MAESTRO_API_KEY (optional)
 * - SANDSHREW_API_KEY (optional)
 */
export function getLaserEyesConfig() {
  const network =
    env.BITCOIN_NETWORK || env.NEXT_PUBLIC_NETWORK || "mainnet";

  const isMainnet = network === "mainnet";

  return {
    network: isMainnet ? MAINNET : TESTNET,
    dataSourceManager: createDataSourceManager(),
    wallets: DEFAULT_WALLETS,
  };
}

/**
 * Singleton DataSourceManager instance
 * Use this if you need to access the DataSourceManager directly
 */
export const dataSourceManager = createDataSourceManager();

