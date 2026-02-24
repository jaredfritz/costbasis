import {
  NormalizedTransaction,
  TaxLot,
  DispositionWithBasis,
  MatchedLot,
  Form8949Entry,
  TaxSummary,
  ProcessingResult,
} from './types';
import { differenceInDays, format } from 'date-fns';

const ONE_YEAR_DAYS = 365;

/**
 * Determine if a holding period is long-term (> 1 year)
 */
function isLongTerm(acquisitionDate: Date, dispositionDate: Date): boolean {
  return differenceInDays(dispositionDate, acquisitionDate) > ONE_YEAR_DAYS;
}

/**
 * Calculate cost basis and gains/losses using FIFO method
 */
export function calculateFIFO(
  transactions: NormalizedTransaction[],
  taxYear: number
): ProcessingResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Group transactions by asset
  const lotsByAsset: Map<string, TaxLot[]> = new Map();
  const dispositions: DispositionWithBasis[] = [];

  // Sort transactions by timestamp
  const sortedTransactions = [...transactions].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  );

  for (const tx of sortedTransactions) {
    const asset = tx.asset;

    if (!lotsByAsset.has(asset)) {
      lotsByAsset.set(asset, []);
    }

    const lots = lotsByAsset.get(asset)!;

    if (tx.type === 'acquisition') {
      // Add a new lot
      const lot: TaxLot = {
        id: tx.id,
        acquisitionDate: tx.timestamp,
        asset: tx.asset,
        originalAmount: tx.amount,
        remainingAmount: tx.amount,
        costBasisPerUnit: tx.amount > 0 ? tx.costBasisUSD / tx.amount : 0,
        totalCostBasis: tx.costBasisUSD,
        source: tx.source,
      };
      lots.push(lot);
    } else if (tx.type === 'disposition') {
      // Match against existing lots using FIFO
      let amountToSell = tx.amount;
      const matchedLots: MatchedLot[] = [];
      let totalCostBasis = 0;

      // Filter to lots with remaining amount, sorted by acquisition date (FIFO)
      const availableLots = lots
        .filter((lot) => lot.remainingAmount > 0)
        .sort((a, b) => a.acquisitionDate.getTime() - b.acquisitionDate.getTime());

      for (const lot of availableLots) {
        if (amountToSell <= 0) break;

        const amountFromLot = Math.min(lot.remainingAmount, amountToSell);
        const costBasisFromLot = amountFromLot * lot.costBasisPerUnit;

        matchedLots.push({
          lotId: lot.id,
          acquisitionDate: lot.acquisitionDate,
          amountUsed: amountFromLot,
          costBasisUsed: costBasisFromLot,
          holdingPeriod: isLongTerm(lot.acquisitionDate, tx.timestamp)
            ? 'long-term'
            : 'short-term',
        });

        lot.remainingAmount -= amountFromLot;
        totalCostBasis += costBasisFromLot;
        amountToSell -= amountFromLot;
      }

      // Check if we had enough lots to cover the sale
      if (amountToSell > 0.00000001) { // Small tolerance for floating point
        warnings.push(
          `Warning: Sold ${tx.amount} ${asset} on ${format(tx.timestamp, 'yyyy-MM-dd')} ` +
          `but only ${tx.amount - amountToSell} ${asset} was available in lots. ` +
          `Missing ${amountToSell.toFixed(8)} ${asset} - cost basis may be incomplete.`
        );
      }

      // Determine overall holding period
      const hasLongTerm = matchedLots.some((m) => m.holdingPeriod === 'long-term');
      const hasShortTerm = matchedLots.some((m) => m.holdingPeriod === 'short-term');
      const holdingPeriod: 'short-term' | 'long-term' | 'mixed' =
        hasLongTerm && hasShortTerm ? 'mixed' : hasLongTerm ? 'long-term' : 'short-term';

      const disposition: DispositionWithBasis = {
        dispositionDate: tx.timestamp,
        asset: tx.asset,
        amountSold: tx.amount,
        proceeds: tx.proceedsUSD,
        lots: matchedLots,
        totalCostBasis,
        gainLoss: tx.proceedsUSD - totalCostBasis,
        holdingPeriod,
        source: tx.source,
      };

      dispositions.push(disposition);
    }
  }

  // Filter dispositions to the tax year
  const taxYearStart = new Date(taxYear, 0, 1);
  const taxYearEnd = new Date(taxYear, 11, 31, 23, 59, 59, 999);

  const taxYearDispositions = dispositions.filter(
    (d) => d.dispositionDate >= taxYearStart && d.dispositionDate <= taxYearEnd
  );

  // Generate Form 8949 entries
  const form8949Entries = generateForm8949Entries(taxYearDispositions);

  // Calculate summary
  const taxSummary = calculateTaxSummary(form8949Entries, taxYear);

  // Get remaining lots for informational purposes
  const remainingLots: TaxLot[] = [];
  lotsByAsset.forEach((lots) => {
    lots.filter((l) => l.remainingAmount > 0).forEach((l) => remainingLots.push(l));
  });

  return {
    success: true,
    taxSummary,
    dispositions: taxYearDispositions,
    remainingLots,
    warnings,
    errors,
  };
}

/**
 * Generate Form 8949 entries from dispositions
 */
function generateForm8949Entries(dispositions: DispositionWithBasis[]): Form8949Entry[] {
  const entries: Form8949Entry[] = [];

  for (const disposition of dispositions) {
    // If mixed holding period, split into separate entries
    if (disposition.holdingPeriod === 'mixed') {
      const longTermLots = disposition.lots.filter((l) => l.holdingPeriod === 'long-term');
      const shortTermLots = disposition.lots.filter((l) => l.holdingPeriod === 'short-term');

      const totalAmount = disposition.amountSold;
      const longTermAmount = longTermLots.reduce((sum, l) => sum + l.amountUsed, 0);
      const shortTermAmount = shortTermLots.reduce((sum, l) => sum + l.amountUsed, 0);

      // Long-term entry
      if (longTermLots.length > 0) {
        const longTermCostBasis = longTermLots.reduce((sum, l) => sum + l.costBasisUsed, 0);
        const longTermProceeds = (longTermAmount / totalAmount) * disposition.proceeds;

        entries.push({
          description: `${disposition.asset} (${longTermAmount.toFixed(8)})`,
          dateAcquired: 'Various',
          dateSold: format(disposition.dispositionDate, 'MM/dd/yyyy'),
          proceeds: Math.round(longTermProceeds * 100) / 100,
          costBasis: Math.round(longTermCostBasis * 100) / 100,
          adjustmentCode: '',
          adjustmentAmount: 0,
          gainLoss: Math.round((longTermProceeds - longTermCostBasis) * 100) / 100,
          holdingPeriod: 'long-term',
          box: 'E',
        });
      }

      // Short-term entry
      if (shortTermLots.length > 0) {
        const shortTermCostBasis = shortTermLots.reduce((sum, l) => sum + l.costBasisUsed, 0);
        const shortTermProceeds = (shortTermAmount / totalAmount) * disposition.proceeds;

        entries.push({
          description: `${disposition.asset} (${shortTermAmount.toFixed(8)})`,
          dateAcquired: 'Various',
          dateSold: format(disposition.dispositionDate, 'MM/dd/yyyy'),
          proceeds: Math.round(shortTermProceeds * 100) / 100,
          costBasis: Math.round(shortTermCostBasis * 100) / 100,
          adjustmentCode: '',
          adjustmentAmount: 0,
          gainLoss: Math.round((shortTermProceeds - shortTermCostBasis) * 100) / 100,
          holdingPeriod: 'short-term',
          box: 'B',
        });
      }
    } else {
      // Single holding period
      const dateAcquired =
        disposition.lots.length === 1
          ? format(disposition.lots[0].acquisitionDate, 'MM/dd/yyyy')
          : 'Various';

      entries.push({
        description: `${disposition.asset} (${disposition.amountSold.toFixed(8)})`,
        dateAcquired,
        dateSold: format(disposition.dispositionDate, 'MM/dd/yyyy'),
        proceeds: Math.round(disposition.proceeds * 100) / 100,
        costBasis: Math.round(disposition.totalCostBasis * 100) / 100,
        adjustmentCode: '',
        adjustmentAmount: 0,
        gainLoss: Math.round(disposition.gainLoss * 100) / 100,
        holdingPeriod: disposition.holdingPeriod as 'short-term' | 'long-term',
        box: disposition.holdingPeriod === 'long-term' ? 'E' : 'B',
      });
    }
  }

  return entries;
}

/**
 * Calculate tax summary from Form 8949 entries
 */
function calculateTaxSummary(entries: Form8949Entry[], taxYear: number): TaxSummary {
  const shortTermEntries = entries.filter((e) => e.holdingPeriod === 'short-term');
  const longTermEntries = entries.filter((e) => e.holdingPeriod === 'long-term');

  const shortTermProceeds = shortTermEntries.reduce((sum, e) => sum + e.proceeds, 0);
  const shortTermCostBasis = shortTermEntries.reduce((sum, e) => sum + e.costBasis, 0);
  const shortTermGainLoss = shortTermEntries.reduce((sum, e) => sum + e.gainLoss, 0);

  const longTermProceeds = longTermEntries.reduce((sum, e) => sum + e.proceeds, 0);
  const longTermCostBasis = longTermEntries.reduce((sum, e) => sum + e.costBasis, 0);
  const longTermGainLoss = longTermEntries.reduce((sum, e) => sum + e.gainLoss, 0);

  return {
    taxYear,
    shortTerm: {
      totalProceeds: Math.round(shortTermProceeds * 100) / 100,
      totalCostBasis: Math.round(shortTermCostBasis * 100) / 100,
      totalGainLoss: Math.round(shortTermGainLoss * 100) / 100,
      entries: shortTermEntries,
    },
    longTerm: {
      totalProceeds: Math.round(longTermProceeds * 100) / 100,
      totalCostBasis: Math.round(longTermCostBasis * 100) / 100,
      totalGainLoss: Math.round(longTermGainLoss * 100) / 100,
      entries: longTermEntries,
    },
    totalProceeds: Math.round((shortTermProceeds + longTermProceeds) * 100) / 100,
    totalCostBasis: Math.round((shortTermCostBasis + longTermCostBasis) * 100) / 100,
    netGainLoss: Math.round((shortTermGainLoss + longTermGainLoss) * 100) / 100,
  };
}
