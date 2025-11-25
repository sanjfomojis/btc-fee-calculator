-- Bitcoin Ordinals Inscription DApp Database Schema
-- For Vercel Postgres

-- Inscriptions table - stores inscription transaction data
CREATE TABLE IF NOT EXISTS inscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  txid TEXT NOT NULL UNIQUE,
  recipient_address TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_size INTEGER NOT NULL,
  fee_rate INTEGER NOT NULL,
  fee_paid BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  block_height INTEGER,
  network TEXT NOT NULL DEFAULT 'mainnet' -- mainnet, testnet
);

-- Transaction history table - tracks all transactions
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
);

-- User sessions table - optional, for tracking user activity
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inscriptions_txid ON inscriptions(txid);
CREATE INDEX IF NOT EXISTS idx_inscriptions_recipient ON inscriptions(recipient_address);
CREATE INDEX IF NOT EXISTS idx_inscriptions_status ON inscriptions(status);
CREATE INDEX IF NOT EXISTS idx_inscriptions_created ON inscriptions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_txid ON transactions(txid);
CREATE INDEX IF NOT EXISTS idx_transactions_from ON transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_transactions_to ON transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

CREATE INDEX IF NOT EXISTS idx_user_sessions_address ON user_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

