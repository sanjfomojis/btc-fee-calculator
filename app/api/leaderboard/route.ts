import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

export async function GET() {
  try {
    const db = getDatabase();
    const leaderboard = await db.getLeaderboard(100);
    const totalUsers = await db.getTotalUsers();
    const totalFees = await db.getTotalFees();

    return NextResponse.json({
      success: true,
      leaderboard,
      totalUsers,
      totalFees
    });

  } catch (error) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
