import { NormalizedTransaction, TransactionType } from '../types';

// Binance CSV columns (standard export format):
// Date(UTC), Market, Type, Price, Amount, Total, Fee, Fee Coin
// Example markets: BTCUSDT, ETHUSDT, etc.

interface BinanceRow {
  'Date(UTC)': string;
  'Market': string;
  'Type': string;
  'Price': string;
  'Amount': string;
  'Total': string;
  'Fee': string;
  'Fee Coin': string;
}

function mapBinanceTransactionType(type: string): TransactionType {
  const typeLower = type.toLowerCase();

  if (typeLower === 'buy') {
    return 'buy';
  }
  if (typeLower === 'sell') {
    return 'sell';
  }
  if (typeLower.includes('reward') || typeLower.includes('staking') ||
      typeLower.includes('interest') || typeLower.includes('distribution')) {
    return 'reward';
  }
  if (typeLower.includes('deposit') || typeLower.includes('withdrawal')) {
    return 'transfer';
  }
  if (typeLower.includes('fee')) {
    return 'fee';
  }

  return 'unknown';
}

export function parseBinanceCSV(rows: BinanceRow[]): NormalizedTransaction[] {
  const transactions: NormalizedTransaction[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      const timestamp = new Date(row['Date(UTC)'] + ' UTC');
      const market = row['Market'] || '';
      const txTypeStr = row['Type'] || '';
      const price = parseFloat(row['Price']) || 0;
      const amount = parseFloat(row['Amount']) || 0;
      const total = parseFloat(row['Total']) || 0;
      const fee = parseFloat(row['Fee']) || 0;
      const feeCoin = row['Fee Coin'] || '';

      const txType = mapBinanceTransactionType(txTypeStr);

      if (txType === 'transfer' || txType === 'unknown' || txType === 'fee') {
        continue;
      }

      // Parse market pair (e.g., "BTCUSDT" -> BTC is asset, USDT is quote)
      // Most Binance pairs end with USDT, BUSD, or USD
      let asset = '';
      let quoteAsset = '';

      if (market.endsWith('USDT')) {
        asset = market.replace('USDT', '');
        quoteAsset = 'USDT';
      } else if (market.endsWith('BUSD')) {
        asset = market.replace('BUSD', '');
        quoteAsset = 'BUSD';
      } else if (market.endsWith('USD')) {
        asset = market.replace('USD', '');
        quoteAsset = 'USD';
      } else if (market.endsWith('BTC')) {
        asset = market.replace('BTC', '');
        quoteAsset = 'BTC';
      } else if (market.endsWith('ETH')) {
        asset = market.replace('ETH', '');
        quoteAsset = 'ETH';
      } else {
        // Fallback: assume first 3-4 chars are asset
        asset = market.substring(0, 3);
        quoteAsset = market.substring(3);
      }

      // Skip if we couldn't parse the market
      if (!asset || amount <= 0) {
        continue;
      }

      // Calculate USD value (approximate for non-USD pairs)
      let usdValue = total;
      if (quoteAsset === 'USDT' || quoteAsset === 'BUSD') {
        usdValue = total;
      } else if (quoteAsset === 'USD') {
        usdValue = total;
      } else {
        // For BTC/ETH pairs, we don't have USD value - use total as estimate
        usdValue = total;
      }

      if (txType === 'buy' || txType === 'reward') {
        transactions.push({
          id: `binance-${i}-${timestamp.getTime()}`,
          timestamp,
          type: 'acquisition',
          asset,
          amount,
          costBasisUSD: Math.abs(usdValue),
          proceedsUSD: 0,
          feeUSD: fee,
          source: 'binance',
          rawDescription: `${txTypeStr}: ${market}`,
        });
      } else if (txType === 'sell') {
        transactions.push({
          id: `binance-${i}-${timestamp.getTime()}`,
          timestamp,
          type: 'disposition',
          asset,
          amount,
          costBasisUSD: 0,
          proceedsUSD: Math.abs(usdValue),
          feeUSD: fee,
          source: 'binance',
          rawDescription: `${txTypeStr}: ${market}`,
        });
      }
    } catch (error) {
      console.error(`Error parsing Binance row ${i}:`, error);
    }
  }

  // Sort by timestamp ascending
  transactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return transactions;
}

export function detectBinanceFormat(headers: string[]): boolean {
  // Check for Binance-specific headers
  const requiredHeaders = ['Date(UTC)', 'Market', 'Type'];
  return requiredHeaders.every(h => headers.some(header => header.trim() === h));
}
