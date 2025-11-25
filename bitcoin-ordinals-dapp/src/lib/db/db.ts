/**
 * Database utilities for Vercel Postgres
 * 
 * This module provides database access functions for storing
 * inscription and transaction data.
 */

import { sql } from "@vercel/postgres";

export interface InscriptionRecord {
  id: string;
  txid: string;
  recipient_address: string;
  content_type: string;
  content_size: number;
  fee_rate: number;
  fee_paid: number;
  status: "pending" | "confirmed" | "failed";
  created_at: Date;
  confirmed_at: Date | null;
  block_height: number | null;
  network: "mainnet" | "testnet";
}

export interface TransactionRecord {
  id: string;
  txid: string;
  from_address: string;
  to_address: string;
  amount: number;
  fee: number;
  status: "pending" | "confirmed" | "failed";
  created_at: Date;
  confirmed_at: Date | null;
  block_height: number | null;
  network: "mainnet" | "testnet";
}

/**
 * Initialize database schema
 * Run this once to set up tables
 */
export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS inscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        txid TEXT NOT NULL UNIQUE,
        recipient_address TEXT NOT NULL,
        content_type TEXT NOT NULL,
        content_size INTEGER NOT NULL,
        fee_rate INTEGER NOT NULL,
        fee_paid BIGINT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        confirmed_at TIMESTAMP WITH TIME ZONE,
        block_height INTEGER,
        network TEXT NOT NULL DEFAULT 'mainnet'
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        txid TEXT NOT NULL UNIQUE,
        from_address TEXT NOT NULL,
        to_address TEXT NOT NULL,
        amount BIGINT NOT NULL,
        fee BIGINT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        confirmed_at TIMESTAMP WITH TIME ZONE,
        block_height INTEGER,
        network TEXT NOT NULL DEFAULT 'mainnet'
      )
    `;

    // Create indexes
    await sql`
      CREATE INDEX IF NOT EXISTS idx_inscriptions_txid ON inscriptions(txid)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_inscriptions_recipient ON inscriptions(recipient_address)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_inscriptions_status ON inscriptions(status)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_txid ON transactions(txid)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address)
    `;

    return { success: true };
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

/**
 * Save an inscription record
 */
export async function saveInscription(data: {
  txid: string;
  recipient_address: string;
  content_type: string;
  content_size: number;
  fee_rate: number;
  fee_paid: number;
  network?: "mainnet" | "testnet";
}) {
  try {
    const result = await sql`
      INSERT INTO inscriptions (
        txid,
        recipient_address,
        content_type,
        content_size,
        fee_rate,
        fee_paid,
        network
      ) VALUES (
        ${data.txid},
        ${data.recipient_address},
        ${data.content_type},
        ${data.content_size},
        ${data.fee_rate},
        ${data.fee_paid},
        ${data.network || "mainnet"}
      )
      RETURNING *
    `;

    return result.rows[0] as InscriptionRecord;
  } catch (error) {
    console.error("Failed to save inscription:", error);
    throw error;
  }
}

/**
 * Get inscription by transaction ID
 */
export async function getInscriptionByTxid(txid: string): Promise<InscriptionRecord | null> {
  try {
    const result = await sql`
      SELECT * FROM inscriptions
      WHERE txid = ${txid}
      LIMIT 1
    `;

    return result.rows[0] as InscriptionRecord | null;
  } catch (error) {
    console.error("Failed to get inscription:", error);
    throw error;
  }
}

/**
 * Update inscription status
 */
export async function updateInscriptionStatus(
  txid: string,
  status: "pending" | "confirmed" | "failed",
  blockHeight?: number
) {
  try {
    if (status === "confirmed") {
      const result = await sql`
        UPDATE inscriptions
        SET 
          status = ${status},
          confirmed_at = NOW(),
          block_height = ${blockHeight || null}
        WHERE txid = ${txid}
        RETURNING *
      `;
      return result.rows[0] as InscriptionRecord | null;
    } else {
      const result = await sql`
        UPDATE inscriptions
        SET 
          status = ${status},
          block_height = ${blockHeight || null}
        WHERE txid = ${txid}
        RETURNING *
      `;
      return result.rows[0] as InscriptionRecord | null;
    }
  } catch (error) {
    console.error("Failed to update inscription status:", error);
    throw error;
  }
}

/**
 * Get inscriptions by recipient address
 */
export async function getInscriptionsByRecipient(
  address: string,
  limit: number = 50
): Promise<InscriptionRecord[]> {
  try {
    const result = await sql`
      SELECT * FROM inscriptions
      WHERE recipient_address = ${address}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return result.rows as InscriptionRecord[];
  } catch (error) {
    console.error("Failed to get inscriptions:", error);
    throw error;
  }
}

/**
 * Save a transaction record
 */
export async function saveTransaction(data: {
  txid: string;
  from_address: string;
  to_address: string;
  amount: number;
  fee: number;
  network?: "mainnet" | "testnet";
}) {
  try {
    const result = await sql`
      INSERT INTO transactions (
        txid,
        from_address,
        to_address,
        amount,
        fee,
        network
      ) VALUES (
        ${data.txid},
        ${data.from_address},
        ${data.to_address},
        ${data.amount},
        ${data.fee},
        ${data.network || "mainnet"}
      )
      RETURNING *
    `;

    return result.rows[0] as TransactionRecord;
  } catch (error) {
    console.error("Failed to save transaction:", error);
    throw error;
  }
}

/**
 * Get transaction by transaction ID
 */
export async function getTransactionByTxid(txid: string): Promise<TransactionRecord | null> {
  try {
    const result = await sql`
      SELECT * FROM transactions
      WHERE txid = ${txid}
      LIMIT 1
    `;

    return result.rows[0] as TransactionRecord | null;
  } catch (error) {
    console.error("Failed to get transaction:", error);
    throw error;
  }
}

