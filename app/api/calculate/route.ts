import { NextRequest, NextResponse } from 'next/server';
import { mempoolAPI } from '@/lib/mempool';
import { feeCalculator } from '@/lib/feeCalculator';
import { getDatabase } from '@/lib/database';
import { isValidBitcoinAddress } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address || !isValidBitcoinAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Bitcoin address' },
        { status: 400 }
      );
    }

    // Fetch transactions from mempool.space
    const transactions = await mempoolAPI.getAddressTransactionsWithDetails(address);
    
    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions found for this address' },
        { status: 404 }
      );
    }

    // Calculate fees
    const feeStats = await feeCalculator.calculateFees(transactions);

    // Save to database
    const db = getDatabase();
    await db.saveUserStats(address, feeStats);

    return NextResponse.json({
      success: true,
      stats: feeStats,
      address: address
    });

  } catch (error) {
    console.error('Error in calculate API:', error);
    return NextResponse.json(
      { error: 'Failed to calculate fees' },
      { status: 500 }
    );
  }
}
