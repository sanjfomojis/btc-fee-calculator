'use client';

import { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { isValidBitcoinAddress, formatAddress, getAddressType } from '@/lib/validation';
import { mempoolAPI } from '@/lib/mempool';
import { feeCalculator, FeeStats } from '@/lib/feeCalculator';
import { getDatabase } from '@/lib/database';

export default function Home() {
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<FeeStats | null>(null);
  const [addressType, setAddressType] = useState('');

  const handleAddressChange = (value: string) => {
    const formatted = formatAddress(value);
    setAddress(formatted);
    setError('');
    
    if (formatted) {
      const isValid = isValidBitcoinAddress(formatted);
      if (isValid) {
        setAddressType(getAddressType(formatted));
      } else {
        setAddressType('Invalid');
      }
    } else {
      setAddressType('');
    }
  };

  const handleCalculate = async () => {
    if (!isValidBitcoinAddress(address)) {
      setError('Please enter a valid Bitcoin address');
      return;
    }

    setIsLoading(true);
    setError('');
    setStats(null);

    try {
      // Fetch transactions from mempool.space
      const transactions = await mempoolAPI.getAddressTransactionsWithDetails(address);
      
      if (transactions.length === 0) {
        setError('No transactions found for this address');
        setIsLoading(false);
        return;
      }

      // Calculate fees
      const feeStats = await feeCalculator.calculateFees(transactions);
      setStats(feeStats);

      // Save to database
      const db = getDatabase();
      await db.saveUserStats(address, feeStats);

    } catch (err) {
      console.error('Error calculating fees:', err);
      setError('Failed to fetch transaction data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-bitcoin rounded-full flex items-center justify-center">
            <Calculator className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bitcoin Fee Calculator
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Enter your Bitcoin address to see how much you've paid in transaction fees
        </p>
      </div>

      <div className="card mb-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Bitcoin Address
            </label>
            <div className="relative">
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                placeholder="Enter your Bitcoin address (1..., 3..., or bc1...)"
                className={`input-field pr-10 ${addressType === 'Invalid' && address ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {address && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isValidBitcoinAddress(address) ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {addressType && (
              <p className={`text-sm mt-1 ${addressType === 'Invalid' ? 'text-red-600' : 'text-green-600'}`}>
                {addressType}
              </p>
            )}
          </div>

          <button
            onClick={handleCalculate}
            disabled={!isValidBitcoinAddress(address) || isLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Calculating...
              </div>
            ) : (
              'Calculate Fees'
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {stats && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-bitcoin" />
              Your Fee Statistics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Fees</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalFeesBTC} BTC</p>
                    <p className="text-sm text-gray-500">${stats.totalFeesUSD} USD</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-bitcoin" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.transactionCount}</p>
                    <p className="text-sm text-gray-500">
                      {stats.confirmedTransactions} confirmed, {stats.pendingTransactions} pending
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-bitcoin" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Fee</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageFeeBTC} BTC</p>
                    <p className="text-sm text-gray-500">${stats.averageFeeUSD} USD</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-bitcoin" />
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Highest Fee</p>
                <p className="text-lg font-semibold text-gray-900">{stats.maxFeeBTC} BTC</p>
                <p className="text-sm text-gray-500">${feeCalculator.formatUSD(stats.maxFeeBTC, 35000)} USD</p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Lowest Fee</p>
                <p className="text-lg font-semibold text-gray-900">{stats.minFeeBTC} BTC</p>
                <p className="text-sm text-gray-500">${feeCalculator.formatUSD(stats.minFeeBTC, 35000)} USD</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Your Stats</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => copyToClipboard(`I've paid ${stats.totalFeesBTC} BTC ($${stats.totalFeesUSD}) in Bitcoin transaction fees! Check out my stats: ${window.location.origin}?address=${address}`)}
                className="btn-secondary text-sm"
              >
                Copy Share Text
              </button>
              <button
                onClick={() => copyToClipboard(`${window.location.origin}?address=${address}`)}
                className="btn-secondary text-sm"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
