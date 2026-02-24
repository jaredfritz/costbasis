import { NextRequest, NextResponse } from 'next/server';
import { getAllTransactions, CoinbaseTransaction } from '@/lib/coinbase-api';
import { NormalizedTransaction } from '@/lib/types';

// Map Coinbase transaction types to our normalized types
function mapCoinbaseTransactionType(type: string): 'acquisition' | 'disposition' | null {
  const acquisitionTypes = [
    'buy',
    'fiat_deposit',
    'receive', // might be a transfer, but could be income
    'interest',
    'inflation_reward',
    'staking_reward',
    'learn_reward',
    'referral_bonus',
  ];

  const dispositionTypes = [
    'sell',
    'fiat_withdrawal',
    'send', // might be a transfer
    'trade', // depends on context
  ];

  if (acquisitionTypes.includes(type)) {
    return 'acquisition';
  }
  if (dispositionTypes.includes(type)) {
    return 'disposition';
  }

  return null; // Skip unknown types
}

// Convert Coinbase transactions to our normalized format
function normalizeCoinbaseTransactions(
  transactions: CoinbaseTransaction[]
): NormalizedTransaction[] {
  const normalized: NormalizedTransaction[] = [];

  for (const tx of transactions) {
    // Skip pending or failed transactions
    if (tx.status !== 'completed') {
      continue;
    }

    const txType = mapCoinbaseTransactionType(tx.type);
    if (!txType) {
      continue; // Skip unsupported transaction types
    }

    const amount = parseFloat(tx.amount.amount);
    const nativeAmount = parseFloat(tx.native_amount.amount);
    const currency = tx.amount.currency;

    // Skip USD/fiat transactions
    if (currency === 'USD' || currency === 'EUR' || currency === 'GBP') {
      continue;
    }

    // For trades, we need to handle both sides
    if (tx.type === 'trade') {
      // A trade is both a sell of one currency and a buy of another
      // The amount shown is what you received (positive) or sent (negative)
      if (amount > 0) {
        // This is the receiving side of a trade (acquisition)
        normalized.push({
          id: `cb-${tx.id}-buy`,
          timestamp: new Date(tx.created_at),
          type: 'acquisition',
          asset: currency,
          amount: Math.abs(amount),
          costBasisUSD: Math.abs(nativeAmount),
          proceedsUSD: 0,
          feeUSD: 0,
          source: 'coinbase',
          rawDescription: `Trade: ${tx.details?.title || 'Unknown'}`,
        });
      } else {
        // This is the sending side of a trade (disposition)
        normalized.push({
          id: `cb-${tx.id}-sell`,
          timestamp: new Date(tx.created_at),
          type: 'disposition',
          asset: currency,
          amount: Math.abs(amount),
          costBasisUSD: 0,
          proceedsUSD: Math.abs(nativeAmount),
          feeUSD: 0,
          source: 'coinbase',
          rawDescription: `Trade: ${tx.details?.title || 'Unknown'}`,
        });
      }
      continue;
    }

    // Handle regular transactions
    if (txType === 'acquisition') {
      normalized.push({
        id: `cb-${tx.id}`,
        timestamp: new Date(tx.created_at),
        type: 'acquisition',
        asset: currency,
        amount: Math.abs(amount),
        costBasisUSD: Math.abs(nativeAmount),
        proceedsUSD: 0,
        feeUSD: 0,
        source: 'coinbase',
        rawDescription: `${tx.type}: ${tx.details?.title || tx.description || 'Unknown'}`,
      });
    } else if (txType === 'disposition') {
      normalized.push({
        id: `cb-${tx.id}`,
        timestamp: new Date(tx.created_at),
        type: 'disposition',
        asset: currency,
        amount: Math.abs(amount),
        costBasisUSD: 0,
        proceedsUSD: Math.abs(nativeAmount),
        feeUSD: 0,
        source: 'coinbase',
        rawDescription: `${tx.type}: ${tx.details?.title || tx.description || 'Unknown'}`,
      });
    }
  }

  // Sort by timestamp ascending
  normalized.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Missing access token' },
        { status: 400 }
      );
    }

    // Fetch all transactions from Coinbase
    const { transactions, accounts } = await getAllTransactions(accessToken);

    // Normalize transactions to our format
    const normalizedTransactions = normalizeCoinbaseTransactions(transactions);

    return NextResponse.json({
      success: true,
      transactions: normalizedTransactions,
      rawTransactionCount: transactions.length,
      accountCount: accounts.length,
    });
  } catch (error) {
    console.error('Error fetching Coinbase transactions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
