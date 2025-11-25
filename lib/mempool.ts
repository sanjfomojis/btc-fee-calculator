import axios from 'axios';

export interface Transaction {
  txid: string;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
  vin: Array<{
    prevout: {
      value: number;
    };
  }>;
  vout: Array<{
    value: number;
  }>;
}

export interface AddressInfo {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

export class MempoolAPI {
  private baseUrl = 'https://mempool.space/api';

  async getAddressInfo(address: string): Promise<AddressInfo> {
    try {
      const response = await axios.get(`${this.baseUrl}/address/${address}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching address info:', error);
      throw new Error('Failed to fetch address information');
    }
  }

  async getAddressTransactions(address: string): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/address/${address}/txs`);
      return response.data.map((tx: any) => tx.txid);
    } catch (error) {
      console.error('Error fetching address transactions:', error);
      throw new Error('Failed to fetch address transactions');
    }
  }

  async getTransaction(txid: string): Promise<Transaction> {
    try {
      const response = await axios.get(`${this.baseUrl}/tx/${txid}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw new Error('Failed to fetch transaction details');
    }
  }

  async getAddressTransactionsWithDetails(address: string): Promise<Transaction[]> {
    try {
      const txids = await this.getAddressTransactions(address);
      const transactions: Transaction[] = [];
      
      // Process transactions in batches to avoid rate limiting
      const batchSize = 10;
      for (let i = 0; i < txids.length; i += batchSize) {
        const batch = txids.slice(i, i + batchSize);
        const batchPromises = batch.map(txid => this.getTransaction(txid));
        const batchResults = await Promise.all(batchPromises);
        transactions.push(...batchResults);
        
        // Small delay between batches to be respectful to the API
        if (i + batchSize < txids.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return transactions;
    } catch (error) {
      console.error('Error fetching transactions with details:', error);
      throw new Error('Failed to fetch transaction details');
    }
  }
}

export const mempoolAPI = new MempoolAPI();
