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
  box: 'B' | 'E'; // B = short-term basis not reported, E = long-term basis not reported
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

// Processing result
export interface ProcessingResult {
  success: boolean;
  taxSummary?: TaxSummary;
  dispositions?: DispositionWithBasis[];
  remainingLots?: TaxLot[];
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
