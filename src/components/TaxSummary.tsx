'use client';

import React from 'react';
import { TaxSummary as TaxSummaryType } from '@/lib/types';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Lock } from 'lucide-react';

interface TaxSummaryProps {
  summary: TaxSummaryType;
  isUnlocked?: boolean;
  onUnlock?: () => void;
}

export default function TaxSummary({ summary, isUnlocked = false, onUnlock }: TaxSummaryProps) {
  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount));

    return amount < 0 ? `(${formatted})` : formatted;
  };

  // Blurred value component
  const BlurredValue = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    if (isUnlocked) {
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
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Tax Year {summary.taxYear} Summary
        </h2>
        <p className="text-gray-500 mt-1">
          Calculated using FIFO (First In, First Out) method
        </p>
      </div>

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

      {/* Unlock CTA */}
      {!isUnlocked && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Unlock Your Full Tax Report</h3>
                <p className="text-blue-100 text-sm">
                  Get detailed Form 8949 entries, cost basis breakdown, and export options
                </p>
              </div>
            </div>
            <button
              onClick={onUnlock}
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-lg"
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
            <span className="text-sm font-medium text-gray-600">Transactions</span>
          </div>
          <p className="text-2xl font-semibold text-gray-800">
            {summary.shortTerm.entries.length + summary.longTerm.entries.length}
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
    </div>
  );
}
