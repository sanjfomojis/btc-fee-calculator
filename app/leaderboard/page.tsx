'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Users, DollarSign, TrendingUp } from 'lucide-react';
import { getDatabase, UserRecord } from '@/lib/database';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<UserRecord[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const db = getDatabase();
        const users = await db.getLeaderboard(100);
        const userCount = await db.getTotalUsers();
        const fees = await db.getTotalFees();
        
        setLeaderboard(users);
        setTotalUsers(userCount);
        setTotalFees(fees);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatBTC = (sats: number) => {
    return (sats / 100000000).toFixed(8);
  };

  const formatUSD = (btcAmount: string) => {
    return (parseFloat(btcAmount) * 35000).toFixed(2);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">
          {index + 1}
        </span>;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-yellow-50 border-yellow-200';
      case 1:
        return 'bg-gray-50 border-gray-200';
      case 2:
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bitcoin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-bitcoin rounded-full flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Fee Leaderboard
        </h1>
        <p className="text-xl text-gray-600">
          Top Bitcoin fee payers
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <Users className="w-8 h-8 text-bitcoin mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">{totalUsers}</h3>
          <p className="text-gray-600">Total Users</p>
        </div>
        
        <div className="card text-center">
          <DollarSign className="w-8 h-8 text-bitcoin mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">{formatBTC(totalFees)} BTC</h3>
          <p className="text-gray-600">Total Fees Paid</p>
        </div>
        
        <div className="card text-center">
          <TrendingUp className="w-8 h-8 text-bitcoin mx-auto mb-2" />
          <h3 className="text-2xl font-bold text-gray-900">${formatUSD(formatBTC(totalFees))}</h3>
          <p className="text-gray-600">Total USD Value</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Top Fee Payers</h2>
        
        {leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No data yet</p>
            <p className="text-gray-400">Be the first to calculate your fees!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((user, index) => (
              <div
                key={user.address}
                className={`flex items-center justify-between p-4 rounded-lg border ${getRankColor(index)}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getRankIcon(index)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 font-mono">
                        {formatAddress(user.address)}
                      </p>
                      <button
                        onClick={() => navigator.clipboard.writeText(user.address)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copy address"
                      >
                        📋
                      </button>
                    </div>
                    <p className="text-sm text-gray-500">
                      {user.transaction_count} transactions
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {user.total_fees_btc} BTC
                  </p>
                  <p className="text-sm text-gray-500">
                    ${user.total_fees_usd} USD
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="card mt-8 text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Want to see your fees on the leaderboard?
        </h3>
        <p className="text-gray-600 mb-6">
          Calculate your Bitcoin transaction fees and see how you compare!
        </p>
        <a
          href="/"
          className="btn-primary inline-flex items-center"
        >
          Calculate My Fees
        </a>
      </div>
    </div>
  );
}
