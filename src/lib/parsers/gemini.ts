import { NormalizedTransaction, TransactionType } from '../types';

// Gemini CSV columns (standard export format):
// Date, Time (UTC), Type, Symbol, Specification, Liquidity Indicator, Trading Fee (USD), USD Amount, Fee (USD), USD Balance, Trade ID, Order ID, Order Date, Order Time, Client Order ID, API Session, Tx Hash, Deposit Destination, Deposit Tx Output, Withdrawal Destination, Withdrawal Tx Output

interface GeminiRow {
  'Date': string;
  'Time (UTC)': string;
  'Type': string;
  'Symbol': string;
  'Specification'?: string;
  'Liquidity Indicator'?: string;
  'Trading Fee (USD)'?: string;
  'USD Amount'?: string;
 'Fee (USD)'?: string;
  'USD Balance'?: string;
  'Trade ID'?: string;
  'Order ID'?: string;
  [key: string]: string | undefined;
}

function mapGeminiTransactionType(type: string): TransactionType {
  const typeLower = type.toLowerCase();

  if (typeLower === 'buy') {
    return 'buy';
  }
  if (typeLower === 'sell') {
    return 'sell';
  }
  if (typeLower.includes('credit') || typeLower.includes('deposit')) {
    return 'transfer'; // Internal transfers, not taxable
  }
  if (typeLower.includes('debit') || typeLower.includes('withdrawal')) {
    return 'transfer';
  }
  if (typeLower.includes('reward') || typeLower.includes('earn') || typeLower.includes('interest')) {
    return 'reward';
  }

  return 'unknown';
}

export function parseGeminiCSV(rows: GeminiRow[]): NormalizedTransaction[] {
  const transactions: NormalizedTransaction[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      const date = row['Date'] || '';
      const time = row['Time (UTC)'] || '';
      const timestamp = new Date(`${date} ${time} UTC`);

      const txTypeStr = row['Type'] || '';
      const symbol = row['Symbol'] || '';
      const usdAmount = parseFloat(row['USD Amount'] || '0') || 0;
      const fee = Math.abs(parseFloat(row['Fee (USD)'] || '0') || 0);

      const txType = mapGeminiTransactionType(txTypeStr);

      if (txType === 'transfer' || txType === 'unknown' || !symbol) {
        continue;
      }

      // Parse symbol - Gemini typically uses formats like "BTC", "ETH", "BTCUSD"
      // Extract crypto asset from symbol
      let asset = symbol;
      if (symbol.endsWith('USD')) {
        asset = symbol.replace('USD', '');
      }

      if (!asset) {
        continue;
      }

      // Gemini uses positive USD amounts for buys (you pay USD) and negative for sells (you receive USD)
      if (txType === 'buy' || txType === 'reward') {
        // For buys: positive USD amount is what you paid
        transactions.push({
          id: `gemini-${i}-${timestamp.getTime()}`,
          timestamp,
          type: 'acquisition',
          asset,
          amount: Math.abs(usdAmount) / (usdAmount || 1), // Estimate amount from USD value
          costBasisUSD: Math.abs(usdAmount),
          proceedsUSD: 0,
          feeUSD: fee,
          source: 'gemini',
          rawDescription: `${txTypeStr}: ${symbol}`,
        });
      } else if (txType === 'sell') {
        // For sells: negative USD amount is what you received
        transactions.push({
          id: `gemini-${i}-${timestamp.getTime()}`,
          timestamp,
          type: 'disposition',
          asset,
          amount: Math.abs(usdAmount) / (usdAmount || 1), // Estimate amount from USD value
          costBasisUSD: 0,
          proceedsUSD: Math.abs(usdAmount),
          feeUSD: fee,
          source: 'gemini',
          rawDescription: `${txTypeStr}: ${symbol}`,
        });
      }
    } catch (error) {
      console.error(`Error parsing Gemini row ${i}:`, error);
    }
  }

  // Sort by timestamp ascending
  transactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return transactions;
}

export function detectGeminiFormat(headers: string[]): boolean {
  // Check for Gemini-specific headers
  const requiredHeaders = ['Date', 'Time (UTC)', 'Type', 'Symbol', 'USD Amount'];
  return requiredHeaders.every(h => headers.some(header => header.trim() === h));
}
