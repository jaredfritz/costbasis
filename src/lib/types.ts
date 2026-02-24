// Core transaction types
export type TransactionType = 'buy' | 'sell' | 'transfer' | 'reward' | 'fee' | 'dust_conversion' | 'unknown';

export type ExchangeSource = 'crypto.com' | 'coinbase' | 'unknown';

export interface RawTransaction {
  timestamp: Date;
  type: TransactionType;
  asset: string;
  amount: number;
  costUSD: number;
  feeUSD: number;
  source: ExchangeSource;
  rawDescription: string;
  transactionHash?: string;
}

// Normalized transaction for tax calculations
export interface NormalizedTransaction {
  id: string;
  timestamp: Date;
  type: 'acquisition' | 'disposition';
  asset: string;
  amount: number;
  costBasisUSD: number;
  proceedsUSD: number;
  feeUSD: number;
  source: ExchangeSource;
  rawDescription: string;
}

// Lot tracking for FIFO
export interface TaxLot {
  id: string;
  acquisitionDate: Date;
  asset: string;
  originalAmount: number;
  remainingAmount: number;
  costBasisPerUnit: number;
  totalCostBasis: number;
  source: ExchangeSource;
}

// Disposition with matched lots
export interface DispositionWithBasis {
  dispositionDate: Date;
  asset: string;
  amountSold: number;
  proceeds: number;
  lots: MatchedLot[];
  totalCostBasis: number;
  gainLoss: number;
  holdingPeriod: 'short-term' | 'long-term' | 'mixed';
  source: ExchangeSource;
}

export interface MatchedLot {
  lotId: string;
  acquisitionDate: Date;
  amountUsed: number;
  costBasisUsed: number;
  holdingPeriod: 'short-term' | 'long-term';
}

// 1099-DA Form Data (IRS Form for Digital Assets starting 2025)
export interface Form1099DA {
  fileName: string;
  exchange: string; // Name of the exchange/broker
  grossProceeds: number; // Box 1a - Gross proceeds
  basisReportedToIRS: boolean; // Whether cost basis was reported to IRS
  shortTermBox: 'G' | 'H' | 'I'; // G = basis reported, H = basis not reported, I = not applicable
  longTermBox: 'J' | 'K' | 'L'; // J = basis reported, K = basis not reported, L = not applicable
  hasShortTerm: boolean;
  hasLongTerm: boolean;
  taxYear: number;
}

// Manual entry data for 1099-DA when user enters info
export interface Form1099DAManualEntry {
  exchange: string;
  grossProceeds: number;
  basisReportedToIRS: boolean;
  hasShortTerm: boolean;
  hasLongTerm: boolean;
}

// Form 8949 entry
export interface Form8949Entry {
  description: string;
  dateAcquired: string;
  dateSold: string;
  proceeds: number;
  costBasis: number;
  adjustmentCode: string;
  adjustmentAmount: number;
  gainLoss: number;
  holdingPeriod: 'short-term' | 'long-term';
  box: 'B' | 'E' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'; // Traditional securities (A-F) or Digital assets (G-L)
}

// Tax summary
export interface TaxSummary {
  taxYear: number;
  shortTerm: {
    totalProceeds: number;
    totalCostBasis: number;
    totalGainLoss: number;
    entries: Form8949Entry[];
  };
  longTerm: {
    totalProceeds: number;
    totalCostBasis: number;
    totalGainLoss: number;
    entries: Form8949Entry[];
  };
  totalProceeds: number;
  totalCostBasis: number;
  netGainLoss: number;
}

// Discrepancy between 1099-DA and calculated values
export interface Discrepancy {
  type: 'proceeds' | 'missing-transactions' | 'extra-transactions';
  severity: 'error' | 'warning';
  message: string;
  form1099DA?: string; // Which 1099-DA form this relates to
  expected?: number;
  actual?: number;
}

// Processing result
export interface ProcessingResult {
  success: boolean;
  taxSummary?: TaxSummary;
  dispositions?: DispositionWithBasis[];
  remainingLots?: TaxLot[];
  form1099DAs?: Form1099DA[]; // Uploaded 1099-DA forms
  discrepancies?: Discrepancy[]; // Validation issues between 1099-DA and transactions
  warnings: string[];
  errors: string[];
}

// Tax software guide step
export interface TaxSoftwareStep {
  stepNumber: number;
  instruction: string;
  value?: string;
  screenshot?: string;
}

export interface TaxSoftwareGuide {
  softwareName: string;
  steps: TaxSoftwareStep[];
}
