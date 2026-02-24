import { NormalizedTransaction, ExchangeSource } from '../types';
import { parseCryptoComCSV, detectCryptoComFormat } from './crypto-com';
import { parseCoinbaseCSV, detectCoinbaseFormat } from './coinbase';

export interface ParseResult {
  success: boolean;
  transactions: NormalizedTransaction[];
  source: ExchangeSource;
  warnings: string[];
  errors: string[];
}

export function detectExchangeFormat(headers: string[]): ExchangeSource {
  if (detectCryptoComFormat(headers)) {
    return 'crypto.com';
  }
  if (detectCoinbaseFormat(headers)) {
    return 'coinbase';
  }
  return 'unknown';
}

export function parseCSV(rows: Record<string, string>[], headers: string[]): ParseResult {
  const source = detectExchangeFormat(headers);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (source === 'unknown') {
    return {
      success: false,
      transactions: [],
      source,
      warnings,
      errors: ['Unable to detect exchange format. Please ensure you are uploading a CSV from Crypto.com or Coinbase.'],
    };
  }

  try {
    let transactions: NormalizedTransaction[];

    if (source === 'crypto.com') {
      transactions = parseCryptoComCSV(rows as any);
    } else if (source === 'coinbase') {
      transactions = parseCoinbaseCSV(rows as any);
    } else {
      transactions = [];
    }

    if (transactions.length === 0) {
      warnings.push('No taxable transactions found in the uploaded file.');
    }

    return {
      success: true,
      transactions,
      source,
      warnings,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      transactions: [],
      source,
      warnings,
      errors: [`Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

export { parseCryptoComCSV, detectCryptoComFormat } from './crypto-com';
export { parseCoinbaseCSV, detectCoinbaseFormat, preprocessCoinbaseCSV } from './coinbase';
