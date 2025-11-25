// Local development fallback using in-memory storage
import { FeeStats } from './feeCalculator';

export interface UserRecord {
  address: string;
  total_fees: number;
  total_fees_btc: string;
  total_fees_usd: string;
  transaction_count: number;
  created_at: string;
  updated_at: string;
}

class LocalDatabaseManager {
  private users: Map<string, UserRecord> = new Map();
  private leaderboard: UserRecord[] = [];
  private stats = { totalUsers: 0, totalFees: 0 };

  async saveUserStats(address: string, stats: FeeStats): Promise<void> {
    const now = new Date().toISOString();
    
    const userRecord: UserRecord = {
      address,
      total_fees: stats.totalFees,
      total_fees_btc: stats.totalFeesBTC,
      total_fees_usd: stats.totalFeesUSD,
      transaction_count: stats.transactionCount,
      created_at: now,
      updated_at: now
    };

    // Save user record
    this.users.set(address, userRecord);
    
    // Update leaderboard
    this.updateLeaderboard(userRecord);
    
    // Update global stats
    this.stats.totalUsers += 1;
    this.stats.totalFees += stats.totalFees;
  }

  private updateLeaderboard(userRecord: UserRecord): void {
    // Remove existing entry if it exists
    this.leaderboard = this.leaderboard.filter(user => user.address !== userRecord.address);
    
    // Add new/updated entry
    this.leaderboard.push(userRecord);
    
    // Sort by total_fees descending and limit to 100
    this.leaderboard = this.leaderboard
      .sort((a, b) => b.total_fees - a.total_fees)
      .slice(0, 100);
  }

  async getUserStats(address: string): Promise<UserRecord | null> {
    return this.users.get(address) || null;
  }

  async getLeaderboard(limit: number = 100): Promise<UserRecord[]> {
    return this.leaderboard.slice(0, limit);
  }

  async getTotalUsers(): Promise<number> {
    return this.stats.totalUsers;
  }

  async getTotalFees(): Promise<number> {
    return this.stats.totalFees;
  }
}

// Singleton instance
let dbInstance: LocalDatabaseManager | null = null;

export function getLocalDatabase(): LocalDatabaseManager {
  if (!dbInstance) {
    dbInstance = new LocalDatabaseManager();
  }
  return dbInstance;
}
