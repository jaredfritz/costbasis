import { NormalizedTransaction, TransactionType } from '../types';

// Coinbase CSV columns (standard export format):
// ID, Timestamp, Transaction Type, Asset, Quantity Transacted, Price Currency,
// Price at Transaction, Subtotal, Total (inclusive of fees and/or spread), Fees and/or Spread, Notes
//
// Note: Some exports use "Spot Price Currency" / "Spot Price at Transaction" instead of
// "Price Currency" / "Price at Transaction"

interface CoinbaseRow {
  'ID'?: string;
  'Timestamp': string;
  'Transaction Type': string;
  'Asset': string;
  'Quantity Transacted': string;
  'Spot Price Currency'?: string;
  'Price Currency'?: string;
  'Spot Price at Transaction'?: string;
  'Price at Transaction'?: string;
  'Subtotal': string;
  'Total (inclusive of fees and/or spread)': string;
  'Fees and/or Spread': string;
  'Notes': string;
}

// Alternative Coinbase format (transaction history)
interface CoinbaseAltRow {
  'Timestamp': string;
  'Type': string;
  'Asset': string;
  'Amount': string;
  'Balance': string;
  'Unit': string;
  'Transfer ID': string;
  'Transfer Total': string;
  'Transfer Total Currency': string;
  'Transfer Fee': string;
  'Transfer Fee Currency': string;
  'Order Price': string;
  'Order Currency': string;
  'Order Amount': string;
}

function mapCoinbaseTransactionType(type: string): TransactionType {
  const typeLower = type.toLowerCase();

  if (typeLower === 'buy' || typeLower === 'advanced trade buy') {
    return 'buy';
  }
  if (typeLower === 'sell' || typeLower === 'advanced trade sell') {
    return 'sell';
  }
  if (typeLower === 'send' || typeLower === 'receive') {
    return 'transfer';
  }
  if (typeLower.includes('reward') || typeLower.includes('earn') ||
      typeLower.includes('staking') || typeLower.includes('interest') ||
      typeLower.includes('learning reward')) {
    return 'reward';
  }
  if (typeLower === 'convert') {
    return 'sell'; // Converts are treated as sell + buy
  }
  if (typeLower.includes('fee')) {
    return 'fee';
  }

  return 'unknown';
}

export function parseCoinbaseCSV(rows: (CoinbaseRow | CoinbaseAltRow)[]): NormalizedTransaction[] {
  const transactions: NormalizedTransaction[] = [];

  // Detect which format we have
  const firstRow = rows[0];
  const isStandardFormat = 'Transaction Type' in firstRow;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      if (isStandardFormat) {
        const stdRow = row as CoinbaseRow;

        const timestamp = new Date(stdRow['Timestamp']);
        const txTypeStr = stdRow['Transaction Type'] || '';
        const asset = stdRow['Asset'] || '';
        // Quantity can be negative (e.g., for Send transactions), so use Math.abs
        const rawQuantity = parseFloat(stdRow['Quantity Transacted']) || 0;
        const quantity = Math.abs(rawQuantity);
        // Handle both regular "-$123.45" and "$123.45" formats
        const subtotal = Math.abs(parseFloat(stdRow['Subtotal']?.replace(/[$,]/g, '')) || 0);
        const total = Math.abs(parseFloat(stdRow['Total (inclusive of fees and/or spread)']?.replace(/[$,]/g, '')) || 0);
        const fees = Math.abs(parseFloat(stdRow['Fees and/or Spread']?.replace(/[$,]/g, '')) || 0);
        const notes = stdRow['Notes'] || '';
        // Use ID if available, otherwise generate one
        const txId = stdRow['ID'] || `cb-${i}-${timestamp.getTime()}`;

        const txType = mapCoinbaseTransactionType(txTypeStr);

        if (txType === 'transfer' || txType === 'unknown' || txType === 'fee') {
          continue;
        }

        if (asset && quantity > 0) {
          if (txType === 'buy' || txType === 'reward') {
            transactions.push({
              id: txId,
              timestamp,
              type: 'acquisition',
              asset,
              amount: quantity,
              costBasisUSD: total || subtotal,
              proceedsUSD: 0,
              feeUSD: fees,
              source: 'coinbase',
              rawDescription: `${txTypeStr}: ${notes}`.trim(),
            });
          } else if (txType === 'sell') {
            transactions.push({
              id: txId,
              timestamp,
              type: 'disposition',
              asset,
              amount: quantity,
              costBasisUSD: 0,
              proceedsUSD: subtotal || total,
              feeUSD: fees,
              source: 'coinbase',
              rawDescription: `${txTypeStr}: ${notes}`.trim(),
            });
          }
        }
      } else {
        // Alternative format
        const altRow = row as CoinbaseAltRow;

        const timestamp = new Date(altRow['Timestamp']);
        const txTypeStr = altRow['Type'] || '';
        const asset = altRow['Asset'] || altRow['Unit'] || '';
        const amount = parseFloat(altRow['Amount']) || 0;
        const transferTotal = parseFloat(altRow['Transfer Total']?.replace(/[$,]/g, '')) || 0;
        const orderAmount = parseFloat(altRow['Order Amount']?.replace(/[$,]/g, '')) || 0;
        const fee = parseFloat(altRow['Transfer Fee']?.replace(/[$,]/g, '')) || 0;

        const txType = mapCoinbaseTransactionType(txTypeStr);

        if (txType === 'transfer' || txType === 'unknown' || txType === 'fee') {
          continue;
        }

        const usdAmount = transferTotal || orderAmount;

        if (asset && Math.abs(amount) > 0) {
          if (txType === 'buy' || txType === 'reward') {
            transactions.push({
              id: `cb-${i}-${timestamp.getTime()}`,
              timestamp,
              type: 'acquisition',
              asset,
              amount: Math.abs(amount),
              costBasisUSD: usdAmount,
              proceedsUSD: 0,
              feeUSD: fee,
              source: 'coinbase',
              rawDescription: txTypeStr,
            });
          } else if (txType === 'sell') {
            transactions.push({
              id: `cb-${i}-${timestamp.getTime()}`,
              timestamp,
              type: 'disposition',
              asset,
              amount: Math.abs(amount),
              costBasisUSD: 0,
              proceedsUSD: usdAmount,
              feeUSD: fee,
              source: 'coinbase',
              rawDescription: txTypeStr,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing Coinbase row ${i}:`, error);
    }
  }

  // Sort by timestamp ascending
  transactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return transactions;
}

export function detectCoinbaseFormat(headers: string[]): boolean {
  // Standard format - may or may not have ID column, may use "Price" or "Spot Price" variants
  const standardHeaders = ['Timestamp', 'Transaction Type', 'Asset', 'Quantity Transacted'];
  const isStandard = standardHeaders.every(h => headers.some(header => header.trim() === h));

  // Alternative format
  const altHeaders = ['Timestamp', 'Type', 'Asset', 'Amount'];
  const isAlt = altHeaders.every(h => headers.some(header => header.trim() === h));

  return isStandard || isAlt;
}

/**
 * Preprocess Coinbase CSV content to handle metadata rows
 * Coinbase CSVs sometimes have header rows like:
 * "Transactions"
 * "User,Name,ID"
 * before the actual CSV headers
 */
export function preprocessCoinbaseCSV(content: string): string {
  const lines = content.split('\n');

  // Find the line that contains the actual CSV headers
  // Look for a line that starts with "ID," or "Timestamp,"
  let headerLineIndex = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i].trim();
    if (line.startsWith('ID,') || line.startsWith('Timestamp,') ||
        line.startsWith('"ID"') || line.startsWith('"Timestamp"')) {
      headerLineIndex = i;
      break;
    }
  }

  // Return content starting from the header line
  if (headerLineIndex > 0) {
    return lines.slice(headerLineIndex).join('\n');
  }

  return content;
}
