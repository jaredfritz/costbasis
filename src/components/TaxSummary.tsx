'use client';

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { TaxSummary as TaxSummaryType } from '@/lib/types';
import { TrendingUp, TrendingDown, DollarSign, Calendar, FileText, Coins } from 'lucide-react';

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

      {/* Summary Badges - "Proof of Utility" */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Processing Badge */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Heavy Lifting Complete</p>
              <p className="text-2xl font-bold text-blue-700">
                {transactionCount || 'Multiple'} Transactions Processed
              </p>
            </div>
          </div>
        </div>

        {/* Asset Detection Badge */}
        {topAssets.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Coins className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Assets Detected</p>
                <p className="text-lg font-bold text-green-700">
                  {topAssets.join(', ')}
                  {topAssets.length === 3 && ' + more'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Date Range Badge */}
        {dateRange && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">Transaction Range</p>
                <p className="text-sm font-bold text-purple-700">
                  {format(dateRange.min, 'MMM d, yyyy')} - {format(dateRange.max, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* No Taxable Events Message */}
      {noTaxableEvents && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                No Tax Forms Needed
              </h3>
              <p className="text-blue-800">
                Your transaction history shows $0.00 in proceeds for {summary.taxYear}. This means you had no taxable dispositions during this period, so you don't need to file Form 8949 or report cryptocurrency gains/losses.
              </p>
              <p className="text-sm text-blue-700 mt-2">
                Note: This analysis is based on the transaction data you provided. If you expected to see proceeds but don't, please verify that you've uploaded your complete transaction history.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Savings Hero Stat */}
      {!noTaxableEvents && summary.totalCostBasis > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-amber-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-amber-900 mb-2">
                Don't Overpay!
              </h3>
              <p className="text-amber-800 text-lg mb-3">
                You are at risk of overpaying{' '}
                <span className="font-bold text-2xl text-amber-900">
                  <BlurredValue>{formatCurrency(summary.totalCostBasis * 0.25)}</BlurredValue>
                </span>{' '}
                in taxes if you rely solely on your 1099-DA without calculating your cost basis.
              </p>
              <p className="text-sm text-amber-700">
                Many 1099-DA forms report $0 in cost basis, which means the IRS would tax you on the full proceeds amount. Our tool recovered{' '}
                <BlurredValue className="font-semibold">{formatCurrency(summary.totalCostBasis)}</BlurredValue> in cost basis, potentially saving you thousands.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Net Result Card */}
      <div
        className={`p-6 rounded-xl ${
          isGain ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${isGain ? 'text-green-600' : 'text-red-600'}`}>
              Net Capital {isGain ? 'Gain' : 'Loss'}
            </p>
            <p className={`text-3xl font-bold ${isGain ? 'text-green-700' : 'text-red-700'}`}>
              <BlurredValue>{formatCurrency(summary.netGainLoss)}</BlurredValue>
            </p>
          </div>
          {isGain ? (
            <TrendingUp className="w-12 h-12 text-green-500" />
          ) : (
            <TrendingDown className="w-12 h-12 text-red-500" />
          )}
        </div>
      </div>

      {/* Unlock CTA - Download Form 8949 */}
      {!isUnlocked && !noTaxableEvents && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Download Your Completed Form 8949</h3>
                <p className="text-blue-100 text-sm mb-2">
                  We processed {transactionCount || 'multiple'} transactions and calculated your cost basis for {taxableEvents} taxable event{taxableEvents !== 1 ? 's' : ''}.
                </p>
                <p className="text-blue-100 text-sm font-medium">
                  Unlock your complete tax report to file with your taxes.
                </p>
              </div>
            </div>
            <button
              onClick={onUnlock}
              className="px-8 py-4 bg-white text-blue-600 font-bold text-lg rounded-lg hover:bg-blue-50 transition-colors shadow-lg whitespace-nowrap"
            >
              Unlock for $9.99
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Total Proceeds</span>
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            <BlurredValue>{formatCurrency(summary.totalProceeds)}</BlurredValue>
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Total Cost Basis</span>
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            <BlurredValue>{formatCurrency(summary.totalCostBasis)}</BlurredValue>
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Taxable Events</span>
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            {taxableEvents}
          </p>
        </div>
      </div>

      {/* Short-Term vs Long-Term Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Short-Term */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            Short-Term (≤ 1 year)
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Proceeds</span>
              <span className="font-medium">
                <BlurredValue>{formatCurrency(summary.shortTerm.totalProceeds)}</BlurredValue>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cost Basis</span>
              <span className="font-medium">
                <BlurredValue>{formatCurrency(summary.shortTerm.totalCostBasis)}</BlurredValue>
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-medium text-gray-700">Gain/Loss</span>
              <span
                className={`font-bold ${
                  summary.shortTerm.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <BlurredValue>{formatCurrency(summary.shortTerm.totalGainLoss)}</BlurredValue>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Form 8949 Part I, Box B • {summary.shortTerm.entries.length} transaction(s)
            </p>
          </div>
        </div>

        {/* Long-Term */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Long-Term ({'>'} 1 year)
          </h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Proceeds</span>
              <span className="font-medium">
                <BlurredValue>{formatCurrency(summary.longTerm.totalProceeds)}</BlurredValue>
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cost Basis</span>
              <span className="font-medium">
                <BlurredValue>{formatCurrency(summary.longTerm.totalCostBasis)}</BlurredValue>
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-medium text-gray-700">Gain/Loss</span>
              <span
                className={`font-bold ${
                  summary.longTerm.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <BlurredValue>{formatCurrency(summary.longTerm.totalGainLoss)}</BlurredValue>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Form 8949 Part II, Box E • {summary.longTerm.entries.length} transaction(s)
            </p>
          </div>
        </div>
      </div>

      {/* Compare to your 1099-DA */}
      {!noTaxableEvents && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Compare to Your 1099-DA
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p>
              Once you receive your 1099-DA form from your exchange, you should verify that the <strong>Total Proceeds</strong> on your 1099-DA matches the Total Proceeds we calculated above.
            </p>
            <p>
              If there's a significant difference, it may indicate:
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-gray-600">
              <li>Missing transactions in your uploaded CSV</li>
              <li>Transactions from other exchanges not included</li>
              <li>Timing differences in how dispositions are reported</li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-blue-900 font-medium mb-2">
                📦 Record-Keeping Packet Included
              </p>
              <p className="text-blue-800 text-sm">
                When you unlock your report, you'll receive a complete Record-Keeping Packet containing:
              </p>
              <ul className="list-disc list-inside ml-2 mt-2 space-y-1 text-blue-700 text-sm">
                <li>Your completed Form 8949 ready for filing</li>
                <li>A reconciliation report comparing your calculations to your 1099-DA</li>
                <li>Raw CSV data used for the calculation</li>
                <li>Timestamped PDF of all results for your records</li>
              </ul>
              <p className="text-blue-700 text-xs mt-3">
                This comprehensive documentation ensures you have detailed records should any questions arise during tax filing or an audit.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
