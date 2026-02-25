import { NormalizedTransaction, TransactionType } from '../types';

export interface ColumnMapping {
  timestamp?: string;
  type?: string;
  asset?: string;
  amount?: string;
  usdValue?: string;
  fee?: string;
}

function mapGenericTransactionType(type: string): TransactionType {
  const typeLower = type.toLowerCase();

  if (typeLower.includes('buy') || typeLower.includes('purchase')) {
    return 'buy';
  }
  if (typeLower.includes('sell') || typeLower.includes('sale')) {
    return 'sell';
  }
  if (typeLower.includes('reward') || typeLower.includes('staking') ||
      typeLower.includes('earn') || typeLower.includes('interest') ||
      typeLower.includes('mining') || typeLower.includes('cashback')) {
    return 'reward';
  }
  if (typeLower.includes('deposit') || typeLower.includes('withdrawal') ||
      typeLower.includes('transfer') || typeLower.includes('send') ||
      typeLower.includes('receive')) {
    return 'transfer';
  }
  if (typeLower.includes('fee')) {
    return 'fee';
  }

  return 'unknown';
}

export function parseGenericCSV(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): NormalizedTransaction[] {
  const transactions: NormalizedTransaction[] = [];

  if (!mapping.timestamp || !mapping.type || !mapping.asset || !mapping.amount) {
    throw new Error('Missing required column mappings');
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      const timestampStr = row[mapping.timestamp];
      const typeStr = row[mapping.type];
      const asset = row[mapping.asset];
      const amountStr = row[mapping.amount];
      const usdValueStr = mapping.usdValue ? row[mapping.usdValue] : undefined;
      const feeStr = mapping.fee ? row[mapping.fee] : undefined;

      // Skip empty rows
      if (!timestampStr || !typeStr || !asset || !amountStr) {
        continue;
      }

      // Parse timestamp - try multiple formats
      let timestamp: Date;
      try {
        // Try ISO format first
        timestamp = new Date(timestampStr);
        if (isNaN(timestamp.getTime())) {
          // Try adding UTC if no timezone
          timestamp = new Date(timestampStr + ' UTC');
        }
        if (isNaN(timestamp.getTime())) {
          console.warn(`Could not parse timestamp: ${timestampStr}`);
          continue;
        }
      } catch {
        console.warn(`Could not parse timestamp: ${timestampStr}`);
        continue;
      }

      const txType = mapGenericTransactionType(typeStr);

      // Skip transfers and unknown types
      if (txType === 'transfer' || txType === 'unknown' || txType === 'fee') {
        continue;
      }

      // Parse numeric values
      const amount = Math.abs(parseFloat(amountStr.replace(/[^0-9.-]/g, '')) || 0);
      const usdValue = usdValueStr ? Math.abs(parseFloat(usdValueStr.replace(/[^0-9.-]/g, '')) || 0) : 0;
      const fee = feeStr ? Math.abs(parseFloat(feeStr.replace(/[^0-9.-]/g, '')) || 0) : 0;

      if (amount <= 0 || !asset) {
        continue;
      }

      // Determine if this is an acquisition or disposition
      if (txType === 'buy' || txType === 'reward') {
        transactions.push({
          id: `generic-${i}-${timestamp.getTime()}`,
          timestamp,
          type: 'acquisition',
          asset: asset.trim().toUpperCase(),
          amount,
          costBasisUSD: usdValue,
          proceedsUSD: 0,
          feeUSD: fee,
          source: 'unknown',
          rawDescription: `${typeStr}: ${asset}`,
        });
      } else if (txType === 'sell') {
        transactions.push({
          id: `generic-${i}-${timestamp.getTime()}`,
          timestamp,
          type: 'disposition',
          asset: asset.trim().toUpperCase(),
          amount,
          costBasisUSD: 0,
          proceedsUSD: usdValue,
          feeUSD: fee,
          source: 'unknown',
          rawDescription: `${typeStr}: ${asset}`,
        });
      }
    } catch (error) {
      console.error(`Error parsing generic CSV row ${i}:`, error);
    }
  }

  // Sort by timestamp ascending
  transactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return transactions;
}
