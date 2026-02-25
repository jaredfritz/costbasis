import { NormalizedTransaction, TransactionType } from '../types';

// Kraken CSV columns (ledgers export format):
// txid, refid, time, type, subtype, aclass, asset, amount, fee, balance
// Kraken also has a "trades" format with different columns

interface KrakenLedgerRow {
  'txid': string;
  'refid': string;
  'time': string;
  'type': string;
  'subtype'?: string;
  'aclass': string;
  'asset': string;
  'amount': string;
  'fee': string;
  'balance': string;
}

// Kraken trades format
interface KrakenTradeRow {
  'txid': string;
  'ordertxid': string;
  'pair': string;
  'time': string;
  'type': string;
  'ordertype': string;
  'price': string;
  'cost': string;
  'fee': string;
  'vol': string;
  'margin'?: string;
  'misc'?: string;
  'ledgers'?: string;
}

function mapKrakenTransactionType(type: string, subtype?: string): TransactionType {
  const typeLower = type.toLowerCase();
  const subtypeLower = subtype?.toLowerCase() || '';

  if (typeLower === 'trade') {
    return 'buy'; // Will be refined based on amount sign
  }
  if (typeLower === 'buy') {
    return 'buy';
  }
  if (typeLower === 'sell') {
    return 'sell';
  }
  if (typeLower === 'staking' || subtypeLower === 'staking') {
    return 'reward';
  }
  if (typeLower.includes('reward')) {
    return 'reward';
  }
  if (typeLower === 'deposit' || typeLower === 'withdrawal' || typeLower === 'transfer') {
    return 'transfer';
  }

  return 'unknown';
}

// Normalize Kraken asset codes (they use X/Z prefixes)
function normalizeKrakenAsset(asset: string): string {
  // Remove X or Z prefix (Kraken's currency code system)
  if (asset.startsWith('X') || asset.startsWith('Z')) {
    asset = asset.substring(1);
  }

  // Handle common Kraken naming quirks
  if (asset === 'XBT') return 'BTC';
  if (asset === 'XDG') return 'DOGE';

  return asset;
}

export function parseKrakenCSV(rows: (KrakenLedgerRow | KrakenTradeRow)[]): NormalizedTransaction[] {
  const transactions: NormalizedTransaction[] = [];

  if (rows.length === 0) return transactions;

  // Detect format based on headers
  const firstRow = rows[0];
  const isLedgerFormat = 'aclass' in firstRow;
  const isTradeFormat = 'pair' in firstRow;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    try {
      if (isLedgerFormat) {
        const ledgerRow = row as KrakenLedgerRow;

        const timestamp = new Date(ledgerRow['time']);
        const txType = mapKrakenTransactionType(ledgerRow['type'], ledgerRow['subtype']);
        const asset = normalizeKrakenAsset(ledgerRow['asset'] || '');
        const amount = parseFloat(ledgerRow['amount']) || 0;
        const fee = Math.abs(parseFloat(ledgerRow['fee']) || 0);

        if (txType === 'transfer' || txType === 'unknown' || !asset) {
          continue;
        }

        // Kraken uses positive/negative amounts to indicate direction
        if (amount > 0) {
          // Positive amount = acquisition (buy, reward, etc.)
          transactions.push({
            id: `kraken-${ledgerRow['txid']}`,
            timestamp,
            type: 'acquisition',
            asset,
            amount: Math.abs(amount),
            costBasisUSD: 0, // Kraken ledgers don't include USD value
            proceedsUSD: 0,
            feeUSD: 0,
            source: 'kraken',
            rawDescription: `${ledgerRow['type']}: ${asset}`,
          });
        } else if (amount < 0) {
          // Negative amount = disposition (sell, transfer out, etc.)
          if (txType !== 'transfer') {
            transactions.push({
              id: `kraken-${ledgerRow['txid']}`,
              timestamp,
              type: 'disposition',
              asset,
              amount: Math.abs(amount),
              costBasisUSD: 0,
              proceedsUSD: 0, // Kraken ledgers don't include USD value
              feeUSD: 0,
              source: 'kraken',
              rawDescription: `${ledgerRow['type']}: ${asset}`,
            });
          }
        }
      } else if (isTradeFormat) {
        const tradeRow = row as KrakenTradeRow;

        const timestamp = new Date(tradeRow['time']);
        const pair = tradeRow['pair'] || '';
        const txTypeStr = tradeRow['type'] || '';
        const price = parseFloat(tradeRow['price']) || 0;
        const vol = parseFloat(tradeRow['vol']) || 0;
        const cost = parseFloat(tradeRow['cost']) || 0;
        const fee = parseFloat(tradeRow['fee']) || 0;

        // Parse pair (e.g., "XXBTZUSD" -> BTC/USD)
        // Kraken pairs can be complex, try to extract asset
        let asset = '';
        if (pair.includes('XBT') || pair.includes('BTC')) {
          asset = 'BTC';
        } else if (pair.includes('ETH')) {
          asset = 'ETH';
        } else {
          // Try first 3-4 characters after removing X/Z prefix
          asset = normalizeKrakenAsset(pair.substring(0, 4));
        }

        if (!asset || vol <= 0) {
          continue;
        }

        if (txTypeStr.toLowerCase() === 'buy') {
          transactions.push({
            id: `kraken-${tradeRow['txid']}`,
            timestamp,
            type: 'acquisition',
            asset,
            amount: vol,
            costBasisUSD: cost,
            proceedsUSD: 0,
            feeUSD: fee,
            source: 'kraken',
            rawDescription: `Buy: ${pair}`,
          });
        } else if (txTypeStr.toLowerCase() === 'sell') {
          transactions.push({
            id: `kraken-${tradeRow['txid']}`,
            timestamp,
            type: 'disposition',
            asset,
            amount: vol,
            costBasisUSD: 0,
            proceedsUSD: cost,
            feeUSD: fee,
            source: 'kraken',
            rawDescription: `Sell: ${pair}`,
          });
        }
      }
    } catch (error) {
      console.error(`Error parsing Kraken row ${i}:`, error);
    }
  }

  // Sort by timestamp ascending
  transactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return transactions;
}

export function detectKrakenFormat(headers: string[]): boolean {
  // Ledger format
  const ledgerHeaders = ['txid', 'time', 'type', 'asset', 'amount'];
  const isLedger = ledgerHeaders.every(h => headers.some(header => header.trim().toLowerCase() === h.toLowerCase()));

  // Trade format
  const tradeHeaders = ['txid', 'pair', 'time', 'type', 'vol'];
  const isTrade = tradeHeaders.every(h => headers.some(header => header.trim().toLowerCase() === h.toLowerCase()));

  return isLedger || isTrade;
}
