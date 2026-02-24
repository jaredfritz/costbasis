import { NormalizedTransaction, TransactionType } from '../types';

// Crypto.com CSV columns:
// Timestamp (UTC), Transaction Description, Currency, Amount, To Currency, To Amount,
// Native Currency, Native Amount, Native Amount (in USD), Transaction Kind, Transaction Hash

interface CryptoComRow {
  'Timestamp (UTC)': string;
  'Transaction Description': string;
  'Currency': string;
  'Amount': string;
  'To Currency': string;
  'To Amount': string;
  'Native Currency': string;
  'Native Amount': string;
  'Native Amount (in USD)': string;
  'Transaction Kind': string;
  'Transaction Hash': string;
}

// Map Crypto.com transaction kinds to our types
function mapTransactionKind(kind: string, description: string): TransactionType {
  const kindLower = kind.toLowerCase();
  const descLower = description.toLowerCase();

  // FIRST: Skip "lock" transactions - these are order placements, not executions
  // Only "commit" transactions are actual executions
  if (kindLower.includes('_lock') && !kindLower.includes('lockup')) {
    return 'transfer'; // Will be skipped
  }

  // Skip lockup_lock and lockup_unlock - staking doesn't change ownership
  if (kindLower === 'lockup_lock' || kindLower === 'lockup_unlock') {
    return 'transfer'; // Will be skipped
  }

  // Purchases - actual executions only
  if (kindLower.includes('purchase_commit') ||
      kindLower === 'van_purchase' ||
      kindLower === 'viban_purchase') {
    return 'buy';
  }

  // Sales - actual executions only
  if (kindLower.includes('sell_commit') ||
      kindLower === 'crypto_viban_exchange' ||
      kindLower === 'crypto_to_van_sell_order' ||
      kindLower === 'card_top_up') {
    return 'sell';
  }

  // Crypto-to-crypto exchange (e.g., LTC > CRO)
  if (kindLower === 'crypto_exchange') {
    return 'sell'; // Treated as sell of one + buy of another
  }

  // Rewards and staking rewards (these are taxable income AND create cost basis)
  if (kindLower.includes('reward') ||
      kindLower.includes('cashback') ||
      kindLower === 'reimbursement' ||
      kindLower === 'mco_stake_reward' ||
      kindLower === 'referral_card_cashback' ||
      kindLower === 'referral_gift') {
    return 'reward';
  }

  // Skip reverted rewards/cashback
  if (kindLower.includes('reverted') || kindLower.includes('_reverted')) {
    return 'transfer'; // Will be skipped
  }

  // Dust conversion
  if (kindLower.includes('dust_conversion')) {
    return 'dust_conversion';
  }

  // Skip these internal/non-taxable transactions
  if (kindLower.includes('precredit') ||
      kindLower.includes('repayment') ||
      kindLower.includes('transfer') ||
      kindLower.includes('withdrawal') ||
      kindLower.includes('deposit')) {
    return 'transfer'; // Will be skipped
  }

  // Fees
  if (kindLower.includes('fee')) {
    return 'fee';
  }

  // Fallback: check description for actual buy/sell language
  // But be careful not to match "Buy BTC" which is a lock description
  if (descLower.startsWith('bought ')) {
    return 'buy';
  }
  if (descLower.startsWith('sold ')) {
    return 'sell';
  }

  return 'unknown';
}

export function parseCryptoComCSV(rows: CryptoComRow[]): NormalizedTransaction[] {
  const transactions: NormalizedTransaction[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      const timestamp = new Date(row['Timestamp (UTC)'] + ' UTC');
      const kind = row['Transaction Kind'] || '';
      const description = row['Transaction Description'] || '';
      const currency = row['Currency'] || '';
      const amount = parseFloat(row['Amount']) || 0;
      const toCurrency = row['To Currency'] || '';
      const toAmount = parseFloat(row['To Amount']) || 0;
      const nativeAmountUSD = parseFloat(row['Native Amount (in USD)']) || 0;

      const txType = mapTransactionKind(kind, description);

      // Skip internal transfers, locks, precredits, repayments, unknown
      if (txType === 'transfer' || txType === 'fee' || txType === 'unknown') {
        continue;
      }

      // Skip reverted transactions
      if (kind.includes('reverted') || description.toLowerCase().includes('reversal')) {
        continue;
      }

      // Handle purchases (acquisitions)
      if (txType === 'buy') {
        // For purchases: Currency is USD (spent), To Currency is crypto (received)
        const cryptoAsset = toCurrency || currency;
        const cryptoAmount = toAmount || Math.abs(amount);

        if (cryptoAsset && cryptoAsset !== 'USD' && cryptoAmount > 0) {
          transactions.push({
            id: `cc-${i}-${timestamp.getTime()}`,
            timestamp,
            type: 'acquisition',
            asset: cryptoAsset,
            amount: cryptoAmount,
            costBasisUSD: Math.abs(nativeAmountUSD),
            proceedsUSD: 0,
            feeUSD: 0,
            source: 'crypto.com',
            rawDescription: description,
          });
        }
      }

      // Handle sales (dispositions)
      else if (txType === 'sell') {
        const kindLower = kind.toLowerCase();

        // Special handling for crypto_exchange (e.g., LTC > CRO)
        // This is both a sale of the source crypto AND a purchase of the destination
        if (kindLower === 'crypto_exchange') {
          // Disposition of source currency
          if (currency && currency !== 'USD' && amount < 0) {
            transactions.push({
              id: `cc-${i}-${timestamp.getTime()}-sell`,
              timestamp,
              type: 'disposition',
              asset: currency,
              amount: Math.abs(amount),
              costBasisUSD: 0,
              proceedsUSD: Math.abs(nativeAmountUSD),
              feeUSD: 0,
              source: 'crypto.com',
              rawDescription: description,
            });
          }

          // Acquisition of destination currency
          if (toCurrency && toCurrency !== 'USD' && toAmount > 0) {
            transactions.push({
              id: `cc-${i}-${timestamp.getTime()}-buy`,
              timestamp,
              type: 'acquisition',
              asset: toCurrency,
              amount: toAmount,
              costBasisUSD: Math.abs(nativeAmountUSD), // FMV at time of exchange
              proceedsUSD: 0,
              feeUSD: 0,
              source: 'crypto.com',
              rawDescription: description,
            });
          }
        } else {
          // Regular sale
          const cryptoAsset = currency;
          const cryptoAmount = Math.abs(amount);

          if (cryptoAsset && cryptoAsset !== 'USD' && cryptoAmount > 0) {
            transactions.push({
              id: `cc-${i}-${timestamp.getTime()}`,
              timestamp,
              type: 'disposition',
              asset: cryptoAsset,
              amount: cryptoAmount,
              costBasisUSD: 0,
              proceedsUSD: Math.abs(nativeAmountUSD),
              feeUSD: 0,
              source: 'crypto.com',
              rawDescription: description,
            });
          }
        }
      }

      // Handle rewards (acquisitions with FMV as cost basis)
      else if (txType === 'reward') {
        const cryptoAsset = currency;
        const cryptoAmount = Math.abs(amount);

        // Only count positive amounts (rewards received, not reverted)
        if (cryptoAsset && cryptoAsset !== 'USD' && cryptoAmount > 0 && amount > 0) {
          transactions.push({
            id: `cc-${i}-${timestamp.getTime()}`,
            timestamp,
            type: 'acquisition',
            asset: cryptoAsset,
            amount: cryptoAmount,
            // Cost basis for rewards = FMV at time of receipt
            costBasisUSD: Math.abs(nativeAmountUSD),
            proceedsUSD: 0,
            feeUSD: 0,
            source: 'crypto.com',
            rawDescription: description,
          });
        }
      }

      // Handle dust conversions
      else if (txType === 'dust_conversion') {
        if (amount < 0 && currency !== 'USD') {
          // Selling dust (disposition)
          transactions.push({
            id: `cc-${i}-${timestamp.getTime()}`,
            timestamp,
            type: 'disposition',
            asset: currency,
            amount: Math.abs(amount),
            costBasisUSD: 0,
            proceedsUSD: Math.abs(nativeAmountUSD),
            feeUSD: 0,
            source: 'crypto.com',
            rawDescription: description,
          });
        } else if (amount > 0 && currency !== 'USD') {
          // Receiving from dust conversion (acquisition)
          transactions.push({
            id: `cc-${i}-${timestamp.getTime()}`,
            timestamp,
            type: 'acquisition',
            asset: currency,
            amount: Math.abs(amount),
            costBasisUSD: Math.abs(nativeAmountUSD),
            proceedsUSD: 0,
            feeUSD: 0,
            source: 'crypto.com',
            rawDescription: description,
          });
        }
      }

    } catch (error) {
      console.error(`Error parsing row ${i}:`, error);
    }
  }

  // Sort by timestamp ascending
  transactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return transactions;
}

export function detectCryptoComFormat(headers: string[]): boolean {
  const requiredHeaders = ['Timestamp (UTC)', 'Transaction Description', 'Currency', 'Amount', 'Transaction Kind'];
  return requiredHeaders.every(h => headers.some(header => header.trim() === h));
}
