import { z } from "zod";

/**
 * Environment variable schema
 * All environment variables should be validated here
 */
const envSchema = z.object({
  // OrdinalsBot API configuration
  ORDINALSBOT_API_KEY: z.string().optional(),
  ORDINALSBOT_API_URL: z.string().url().default("https://api.ordinalsbot.com"),

  // Bitcoin data provider API keys (for LaserEyes DataSourceManager)
  // Use Maestro for development (https://www.oklink.com/en/maestro)
  MAESTRO_API_KEY: z.string().optional(),
  // Or use Sandshrew (https://sandshrew.io)
  SANDSHREW_API_KEY: z.string().optional(),

  // Mempool.space API (for broadcasting transactions)
  MEMPOOL_API_URL: z.string().url().default("https://mempool.space/api"),

  // Network configuration
  BITCOIN_NETWORK: z.enum(["mainnet", "testnet"]).optional(),
  NEXT_PUBLIC_NETWORK: z.enum(["mainnet", "testnet"]).default("mainnet"),

  // Vercel Postgres (automatically provided by Vercel)
  POSTGRES_URL: z.string().url().optional(),
  POSTGRES_PRISMA_URL: z.string().url().optional(),
  POSTGRES_URL_NON_POOLING: z.string().url().optional(),
});

/**
 * Validated environment variables
 * Access via: env.ORDINALSBOT_API_KEY, etc.
 */
export const env = envSchema.parse({
  ORDINALSBOT_API_KEY: process.env.ORDINALSBOT_API_KEY || undefined,
  ORDINALSBOT_API_URL: process.env.ORDINALSBOT_API_URL || undefined,
  MAESTRO_API_KEY: process.env.MAESTRO_API_KEY || undefined,
  SANDSHREW_API_KEY: process.env.SANDSHREW_API_KEY || undefined,
  MEMPOOL_API_URL: process.env.MEMPOOL_API_URL || undefined,
  BITCOIN_NETWORK: process.env.BITCOIN_NETWORK || undefined,
  NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK || "mainnet",
  POSTGRES_URL: process.env.POSTGRES_URL || undefined,
  POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL || undefined,
  POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING || undefined,
});

