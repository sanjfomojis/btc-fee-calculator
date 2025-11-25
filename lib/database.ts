import { kv } from '@vercel/kv';
import { FeeStats } from './feeCalculator';
import { getLocalDatabase } from './database-local';

export interface UserRecord {
  address: string;
  total_fees: number;
  total_fees_btc: string;
  total_fees_usd: string;
  transaction_count: number;
  created_at: string;
  updated_at: string;
}

class DatabaseManager {
  private getUserKey(address: string): string {
    return `user:${address}`;
  }

  private getLeaderboardKey(): string {
    return 'leaderboard';
  }

  private getStatsKey(): string {
    return 'stats';
  }

  async saveUserStats(address: string, stats: FeeStats): Promise<void> {
    const userKey = this.getUserKey(address);
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
    await kv.set(userKey, userRecord);
    
    // Update leaderboard
    await this.updateLeaderboard(userRecord);
    
    // Update global stats
    await this.updateGlobalStats(stats);
  }

  private async updateLeaderboard(userRecord: UserRecord): Promise<void> {
    const leaderboardKey = this.getLeaderboardKey();
    
    // Get current leaderboard
    const currentLeaderboard = await kv.get<UserRecord[]>(leaderboardKey) || [];
    
    // Remove existing entry if it exists
    const filteredLeaderboard = currentLeaderboard.filter(user => user.address !== userRecord.address);
    
    // Add new/updated entry
    filteredLeaderboard.push(userRecord);
    
    // Sort by total_fees descending and limit to 100
    const sortedLeaderboard = filteredLeaderboard
      .sort((a, b) => b.total_fees - a.total_fees)
      .slice(0, 100);
    
    // Save updated leaderboard
    await kv.set(leaderboardKey, sortedLeaderboard);
  }

  private async updateGlobalStats(stats: FeeStats): Promise<void> {
    const statsKey = this.getStatsKey();
    
    // Get current stats
    const currentStats = await kv.get<{totalUsers: number, totalFees: number}>(statsKey) || {totalUsers: 0, totalFees: 0};
    
    // Update stats (this is approximate since we can't easily track unique users)
    await kv.set(statsKey, {
      totalUsers: currentStats.totalUsers + 1,
      totalFees: currentStats.totalFees + stats.totalFees
    });
  }

  async getUserStats(address: string): Promise<UserRecord | null> {
    const userKey = this.getUserKey(address);
    return await kv.get<UserRecord>(userKey);
  }

  async getLeaderboard(limit: number = 100): Promise<UserRecord[]> {
    const leaderboardKey = this.getLeaderboardKey();
    const leaderboard = await kv.get<UserRecord[]>(leaderboardKey) || [];
    return leaderboard.slice(0, limit);
  }

  async getTotalUsers(): Promise<number> {
    const statsKey = this.getStatsKey();
    const stats = await kv.get<{totalUsers: number, totalFees: number}>(statsKey);
    return stats?.totalUsers || 0;
  }

  async getTotalFees(): Promise<number> {
    const statsKey = this.getStatsKey();
    const stats = await kv.get<{totalUsers: number, totalFees: number}>(statsKey);
    return stats?.totalFees || 0;
  }
}

// Singleton instance
let dbInstance: DatabaseManager | null = null;

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    // Check if we're in a Vercel environment with KV available
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      dbInstance = new DatabaseManager();
    } else {
      // Fallback to local database for development
      return getLocalDatabase() as any;
    }
  }
  return dbInstance;
}
