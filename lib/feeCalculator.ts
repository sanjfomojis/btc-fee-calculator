import { Transaction } from './mempool';

export interface FeeStats {
  totalFees: number;
  totalFeesBTC: string;
  totalFeesUSD: string;
  transactionCount: number;
  averageFee: number;
  averageFeeBTC: string;
  averageFeeUSD: string;
  maxFee: number;
  maxFeeBTC: string;
  minFee: number;
  minFeeBTC: string;
  confirmedTransactions: number;
  pendingTransactions: number;
}

export class FeeCalculator {
  private btcToSats = 100000000; // 1 BTC = 100,000,000 sats

  async calculateFees(transactions: Transaction[], btcPriceUSD: number = 35000): Promise<FeeStats> {
    const confirmedTxs = transactions.filter(tx => tx.status.confirmed);
    const pendingTxs = transactions.filter(tx => !tx.status.confirmed);
    
    const allFees = transactions.map(tx => tx.fee);
    const confirmedFees = confirmedTxs.map(tx => tx.fee);
    
    const totalFees = allFees.reduce((sum, fee) => sum + fee, 0);
    const totalFeesBTC = (totalFees / this.btcToSats).toFixed(8);
    const totalFeesUSD = (parseFloat(totalFeesBTC) * btcPriceUSD).toFixed(2);
    
    const averageFee = allFees.length > 0 ? totalFees / allFees.length : 0;
    const averageFeeBTC = (averageFee / this.btcToSats).toFixed(8);
    const averageFeeUSD = (parseFloat(averageFeeBTC) * btcPriceUSD).toFixed(2);
    
    const maxFee = allFees.length > 0 ? Math.max(...allFees) : 0;
    const maxFeeBTC = (maxFee / this.btcToSats).toFixed(8);
    
    const minFee = allFees.length > 0 ? Math.min(...allFees) : 0;
    const minFeeBTC = (minFee / this.btcToSats).toFixed(8);

    return {
      totalFees,
      totalFeesBTC,
      totalFeesUSD,
      transactionCount: transactions.length,
      averageFee,
      averageFeeBTC,
      averageFeeUSD,
      maxFee,
      maxFeeBTC,
      minFee,
      minFeeBTC,
      confirmedTransactions: confirmedTxs.length,
      pendingTransactions: pendingTxs.length,
    };
  }

  formatSats(sats: number): string {
    return (sats / this.btcToSats).toFixed(8);
  }

  formatUSD(btcAmount: string, btcPriceUSD: number): string {
    return (parseFloat(btcAmount) * btcPriceUSD).toFixed(2);
  }
}

export const feeCalculator = new FeeCalculator();
