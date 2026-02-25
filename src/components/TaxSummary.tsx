'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { TaxSummary as TaxSummaryType } from '@/lib/types';
import { TrendingUp, TrendingDown, Calendar, FileText, Coins } from 'lucide-react';

interface TaxSummaryProps {
  summary: TaxSummaryType;
  isUnlocked?: boolean;
  onUnlock?: () => void;
  transactionCount?: number;
  dateRange?: { min: Date; max: Date };
}

export default function TaxSummary({ summary, isUnlocked = false, onUnlock, transactionCount, dateRange }: TaxSummaryProps) {
  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));

    return amount < 0 ? `(${formatted})` : formatted;
  };

  // If proceeds are $0, no tax calculations are needed - auto-unlock
  const noTaxableEvents = summary.totalProceeds === 0;
  const effectivelyUnlocked = isUnlocked || noTaxableEvents;

  // Extract top 3 assets from form entries
  const topAssets = useMemo(() => {
    const assetCounts = new Map<string, number>();

    // Count asset occurrences from descriptions
    [...summary.shortTerm.entries, ...summary.longTerm.entries].forEach(entry => {
      // Extract asset from description (e.g., "BTC 0.021..." -> "BTC")
      const match = entry.description.match(/^([A-Z0-9]+)\s/);
      if (match) {
        const asset = match[1];
        assetCounts.set(asset, (assetCounts.get(asset) || 0) + 1);
      }
    });

    // Get top 3 by frequency
    return Array.from(assetCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([asset]) => asset);
  }, [summary]);

  const taxableEvents = summary.shortTerm.entries.length + summary.longTerm.entries.length;

  // Blurred value component
  const BlurredValue = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    if (effectivelyUnlocked) {
      return <span className={className}>{children}</span>;
    }
    return (
      <span className={`${className} select-none filter blur-md`} aria-hidden="true">
        {children}
      </span>
    );
  };

  const isGain = summary.netGainLoss >= 0;

  return (
    <div className="space-y-6">
      {/* Header with Processing Badge */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Tax Year {summary.taxYear} Summary
        </h2>
        <p className="text-gray-500 mt-1">
          Calculated using FIFO (First In, First Out) method
        </p>
      </div>

      {/* Summary Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Processing Badge */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[#1A2B3C]" />
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Transactions</p>
              <p className="text-xl font-bold text-[#1A2B3C]">
                {transactionCount || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Asset Detection Badge */}
        {topAssets.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Coins className="w-5 h-5 text-[#1A2B3C]" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Assets</p>
                <p className="text-lg font-bold text-[#1A2B3C]">
                  {topAssets.join(', ')}
                  {topAssets.length === 3 && ' +'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Date Range Badge */}
        {dateRange && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#1A2B3C]" />
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Date Range</p>
                <p className="text-sm font-bold text-[#1A2B3C]">
                  {format(dateRange.min, 'MMM d, yyyy')} - {format(dateRange.max, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* No Taxable Events Message */}
      {noTaxableEvents && (
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <FileText className="w-6 h-6 text-[#1A2B3C]" />
            <div>
              <h3 className="text-lg font-semibold text-[#1A2B3C] mb-2">
                No Tax Forms Needed
              </h3>
              <p className="text-gray-700">
                Your transaction history shows $0.00 in proceeds for {summary.taxYear}. This means you had no taxable dispositions during this period, so you don't need to file Form 8949 or report cryptocurrency gains/losses.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Note: This analysis is based on the transaction data you provided. If you expected to see proceeds but don't, please verify that you've uploaded your complete transaction history.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Savings Hero Stat */}
      {!noTaxableEvents && summary.totalCostBasis > 0 && (
        <div className="bg-[#22C55E]/5 border-2 border-[#22C55E] rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div>
              <h3 className="text-2xl font-bold text-[#1A2B3C] mb-3">
                Don't Overpay!
              </h3>
              <p className="text-gray-700 text-lg mb-3">
                You could overpay{' '}
                <span className="font-bold text-3xl text-[#1A2B3C]">
                  <BlurredValue>{formatCurrency(summary.totalCostBasis * 0.25)}</BlurredValue>
                </span>{' '}
                in taxes without proper cost basis calculation.
              </p>
              <p className="text-gray-600">
                Our tool recovered{' '}
                <BlurredValue className="font-semibold text-[#1A2B3C]">{formatCurrency(summary.totalCostBasis)}</BlurredValue>{' '}
                in cost basis from your transaction history.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Net Result Card */}
      <div className="bg-white border border-gray-300 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase">
              Net Capital {isGain ? 'Gain' : 'Loss'}
            </p>
            <p className="text-4xl font-bold text-[#1A2B3C]">
              <BlurredValue>{formatCurrency(summary.netGainLoss)}</BlurredValue>
            </p>
          </div>
          {isGain ? (
            <TrendingUp className="w-12 h-12 text-[#22C55E]" />
          ) : (
            <TrendingDown className="w-12 h-12 text-gray-400" />
          )}
        </div>
      </div>

      {/* Unlock CTA - Download Form 8949 */}
      {!isUnlocked && !noTaxableEvents && (
        <div className="bg-[#1A2B3C] rounded-lg p-8 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-2xl mb-3">Download Your Completed Form 8949</h3>
              <p className="text-gray-300 mb-2">
                We processed {transactionCount || 'multiple'} transactions and calculated your cost basis for {taxableEvents} taxable event{taxableEvents !== 1 ? 's' : ''}.
              </p>
              <p className="text-white font-medium">
                Unlock your complete tax report to file with your taxes.
              </p>
            </div>
            <button
              onClick={onUnlock}
              className="px-8 py-4 bg-[#22C55E] text-white font-bold text-lg rounded-lg hover:bg-[#22C55E]/90 transition-colors whitespace-nowrap"
            >
              Unlock for $9.99
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Proceeds</p>
          <p className="text-2xl font-bold text-[#1A2B3C]">
            <BlurredValue>{formatCurrency(summary.totalProceeds)}</BlurredValue>
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Cost Basis</p>
          <p className="text-2xl font-bold text-[#1A2B3C]">
            <BlurredValue>{formatCurrency(summary.totalCostBasis)}</BlurredValue>
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Taxable Events</p>
          <p className="text-2xl font-bold text-[#1A2B3C]">
            {taxableEvents}
          </p>
        </div>
      </div>

      {/* Short-Term vs Long-Term Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Short-Term */}
        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <h3 className="text-base font-bold text-[#1A2B3C] mb-4">
            Short-Term (≤ 1 year)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Proceeds</span>
              <span className="font-semibold text-[#1A2B3C]">
                <BlurredValue>{formatCurrency(summary.shortTerm.totalProceeds)}</BlurredValue>
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cost Basis</span>
              <span className="font-semibold text-[#1A2B3C]">
                <BlurredValue>{formatCurrency(summary.shortTerm.totalCostBasis)}</BlurredValue>
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold text-[#1A2B3C]">Gain/Loss</span>
              <span className="font-bold text-[#1A2B3C]">
                <BlurredValue>{formatCurrency(summary.shortTerm.totalGainLoss)}</BlurredValue>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {summary.shortTerm.entries.length} transaction(s)
            </p>
          </div>
        </div>

        {/* Long-Term */}
        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <h3 className="text-base font-bold text-[#1A2B3C] mb-4">
            Long-Term ({'>'} 1 year)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Proceeds</span>
              <span className="font-semibold text-[#1A2B3C]">
                <BlurredValue>{formatCurrency(summary.longTerm.totalProceeds)}</BlurredValue>
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cost Basis</span>
              <span className="font-semibold text-[#1A2B3C]">
                <BlurredValue>{formatCurrency(summary.longTerm.totalCostBasis)}</BlurredValue>
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold text-[#1A2B3C]">Gain/Loss</span>
              <span className="font-bold text-[#1A2B3C]">
                <BlurredValue>{formatCurrency(summary.longTerm.totalGainLoss)}</BlurredValue>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {summary.longTerm.entries.length} transaction(s)
            </p>
          </div>
        </div>
      </div>

      {/* Compare to your 1099-DA */}
      {!noTaxableEvents && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-base font-bold text-[#1A2B3C] mb-3">
            Compare to Your 1099-DA
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              Verify that the <strong>Total Proceeds</strong> on your 1099-DA matches the Total Proceeds calculated above.
            </p>
            <p className="text-gray-600">
              Significant differences may indicate missing transactions, multiple exchanges, or timing differences.
            </p>
            <div className="bg-white border border-gray-300 rounded-lg p-4 mt-4">
              <p className="text-[#1A2B3C] font-semibold mb-2">
                Record-Keeping Packet Included
              </p>
              <ul className="list-disc list-inside ml-2 space-y-1 text-gray-700 text-sm">
                <li>Completed Form 8949 ready for filing</li>
                <li>Reconciliation report vs. your 1099-DA</li>
                <li>Raw transaction data (CSV)</li>
                <li>Timestamped PDF for your records</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
