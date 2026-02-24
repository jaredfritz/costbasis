import { Form1099DA, TaxSummary, Discrepancy, NormalizedTransaction, ExchangeSource } from './types';

/**
 * Validates 1099-DA forms against calculated tax summary
 * Returns array of discrepancies found
 */
export function validate1099DAAgainstCalculations(
  form1099DAs: Form1099DA[],
  taxSummary: TaxSummary,
  transactions: NormalizedTransaction[]
): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];

  // Calculate total proceeds by exchange
  const proceedsByExchange = calculateProceedsByExchange(transactions);

  // Total 1099-DA proceeds
  const total1099DAProceeds = form1099DAs.reduce((sum, form) => sum + form.grossProceeds, 0);

  // Check 1: Total proceeds match
  const totalCalculatedProceeds = taxSummary.totalProceeds;
  const proceedsDifference = Math.abs(total1099DAProceeds - totalCalculatedProceeds);
  const proceedsTolerance = totalCalculatedProceeds * 0.02; // 2% tolerance for rounding differences

  if (proceedsDifference > proceedsTolerance) {
    const percentDiff = ((proceedsDifference / totalCalculatedProceeds) * 100).toFixed(1);
    discrepancies.push({
      type: 'proceeds',
      severity: proceedsDifference > totalCalculatedProceeds * 0.10 ? 'error' : 'warning',
      message: `Total proceeds mismatch: Your 1099-DA form(s) report $${total1099DAProceeds.toFixed(2)} in gross proceeds, but our calculations show $${totalCalculatedProceeds.toFixed(2)} (${percentDiff}% difference). This may indicate missing transactions or incorrect transaction data.`,
      expected: total1099DAProceeds,
      actual: totalCalculatedProceeds,
    });
  }

  // Check 2: Per-exchange validation
  for (const form1099DA of form1099DAs) {
    const exchangeKey = normalizeExchangeName(form1099DA.exchange);
    const calculatedProceeds = proceedsByExchange[exchangeKey] || 0;

    if (calculatedProceeds === 0) {
      discrepancies.push({
        type: 'missing-transactions',
        severity: 'error',
        message: `No transactions found for ${form1099DA.exchange}. Your 1099-DA shows $${form1099DA.grossProceeds.toFixed(2)} in proceeds, but we found no matching transactions. Please ensure you've uploaded the transaction history for this exchange.`,
        form1099DA: form1099DA.fileName,
        expected: form1099DA.grossProceeds,
        actual: 0,
      });
      continue;
    }

    const exchangeDifference = Math.abs(form1099DA.grossProceeds - calculatedProceeds);
    const exchangeTolerance = calculatedProceeds * 0.02; // 2% tolerance

    if (exchangeDifference > exchangeTolerance) {
      const percentDiff = ((exchangeDifference / form1099DA.grossProceeds) * 100).toFixed(1);
      discrepancies.push({
        type: 'proceeds',
        severity: exchangeDifference > form1099DA.grossProceeds * 0.10 ? 'error' : 'warning',
        message: `${form1099DA.exchange} proceeds mismatch: 1099-DA reports $${form1099DA.grossProceeds.toFixed(2)}, but transactions show $${calculatedProceeds.toFixed(2)} (${percentDiff}% difference). Verify your transaction history is complete.`,
        form1099DA: form1099DA.fileName,
        expected: form1099DA.grossProceeds,
        actual: calculatedProceeds,
      });
    }
  }

  // Check 3: Verify holding periods match
  for (const form1099DA of form1099DAs) {
    if (form1099DA.hasShortTerm && taxSummary.shortTerm.entries.length === 0) {
      discrepancies.push({
        type: 'missing-transactions',
        severity: 'warning',
        message: `${form1099DA.exchange} 1099-DA indicates short-term transactions, but none were found in your transaction history.`,
        form1099DA: form1099DA.fileName,
      });
    }

    if (form1099DA.hasLongTerm && taxSummary.longTerm.entries.length === 0) {
      discrepancies.push({
        type: 'missing-transactions',
        severity: 'warning',
        message: `${form1099DA.exchange} 1099-DA indicates long-term transactions, but none were found in your transaction history.`,
        form1099DA: form1099DA.fileName,
      });
    }
  }

  // Check 4: Look for transactions without matching 1099-DA
  const exchanges1099DA = new Set(form1099DAs.map(f => normalizeExchangeName(f.exchange)));
  const exchangesInTransactions = new Set(
    transactions
      .filter(t => t.type === 'disposition' && t.proceedsUSD > 0)
      .map(t => normalizeExchangeSource(t.source))
  );

  for (const exchangeKey of exchangesInTransactions) {
    if (!exchanges1099DA.has(exchangeKey)) {
      const proceeds = proceedsByExchange[exchangeKey] || 0;
      if (proceeds > 10) { // Only flag if proceeds are meaningful (> $10)
        discrepancies.push({
          type: 'extra-transactions',
          severity: 'warning',
          message: `Found ${getExchangeDisplayName(exchangeKey)} transactions with $${proceeds.toFixed(2)} in proceeds, but no 1099-DA form was provided for this exchange. If ${getExchangeDisplayName(exchangeKey)} issued you a 1099-DA, please upload it.`,
        });
      }
    }
  }

  return discrepancies;
}

/**
 * Calculate total proceeds by exchange from transactions
 */
function calculateProceedsByExchange(transactions: NormalizedTransaction[]): Record<string, number> {
  const byExchange: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.type === 'disposition' && tx.proceedsUSD > 0) {
      const exchangeKey = normalizeExchangeSource(tx.source);
      byExchange[exchangeKey] = (byExchange[exchangeKey] || 0) + tx.proceedsUSD;
    }
  }

  return byExchange;
}

/**
 * Normalize exchange name for comparison
 */
function normalizeExchangeName(exchange: string): string {
  const normalized = exchange.toLowerCase().trim();

  if (normalized.includes('coinbase')) return 'coinbase';
  if (normalized.includes('crypto.com')) return 'crypto.com';
  if (normalized.includes('binance')) return 'binance';
  if (normalized.includes('kraken')) return 'kraken';
  if (normalized.includes('gemini')) return 'gemini';

  return normalized;
}

/**
 * Normalize exchange source for comparison
 */
function normalizeExchangeSource(source: ExchangeSource): string {
  if (source === 'crypto.com') return 'crypto.com';
  if (source === 'coinbase') return 'coinbase';
  return source;
}

/**
 * Get display name for exchange
 */
function getExchangeDisplayName(exchangeKey: string): string {
  if (exchangeKey === 'crypto.com') return 'Crypto.com';
  if (exchangeKey === 'coinbase') return 'Coinbase';
  return exchangeKey.charAt(0).toUpperCase() + exchangeKey.slice(1);
}
