'use client';

import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { Calculator, Shield, FileText, HelpCircle, Download, Upload, FileCheck, Lock, DollarSign } from 'lucide-react';
import { FileUpload, TaxSummary, Form8949, TaxSoftwareGuide, Disclaimer, CompactDisclaimer } from '@/components';
import { parseCSV, preprocessCoinbaseCSV } from '@/lib/parsers';
import { calculateFIFO } from '@/lib/calculator';
import { validate1099DAAgainstCalculations } from '@/lib/validation';
import { TaxSummary as TaxSummaryType, NormalizedTransaction, ProcessingResult, Form1099DA } from '@/lib/types';

type TabType = 'summary' | 'form8949' | 'guide';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [allTransactions, setAllTransactions] = useState<NormalizedTransaction[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleFilesParsed = useCallback(
    async (files: { csvFiles: { name: string; content: string }[]; form1099DAFiles: { name: string; file: File }[] }) => {
      setIsProcessing(true);
      setErrors([]);
      setWarnings([]);

      try {
        const allParsedTransactions: NormalizedTransaction[] = [];
        const allWarnings: string[] = [];
        const allErrors: string[] = [];

        // Parse CSV files
        for (const file of files.csvFiles) {
          // Preprocess Coinbase CSVs that may have metadata rows
          let content = file.content;
          if (content.includes('Transactions') && content.includes('Transaction Type')) {
            content = preprocessCoinbaseCSV(content);
          }

          // Parse CSV
          const parseResult = Papa.parse(content, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
          });

          if (parseResult.errors.length > 0) {
            allErrors.push(
              `Error parsing ${file.name}: ${parseResult.errors.map((e) => e.message).join(', ')}`
            );
            continue;
          }

          const headers = parseResult.meta.fields || [];
          const rows = parseResult.data as Record<string, string>[];

          // Parse transactions
          const parsed = parseCSV(rows, headers);

          if (!parsed.success) {
            allErrors.push(...parsed.errors.map((e) => `${file.name}: ${e}`));
            continue;
          }

          allWarnings.push(...parsed.warnings.map((w) => `${file.name}: ${w}`));
          allParsedTransactions.push(...parsed.transactions);
        }

        if (allParsedTransactions.length === 0) {
          setErrors([...allErrors, 'No valid transactions found in the uploaded files.']);
          setIsProcessing(false);
          return;
        }

        setAllTransactions(allParsedTransactions);

        // Create simplified Form1099DA objects from uploaded files (if any)
        // For now, we just track that they were uploaded - full parsing would require OCR
        const form1099DAs: Form1099DA[] = files.form1099DAFiles.map(f => ({
          fileName: f.name,
          exchange: 'Unknown', // Would need OCR or manual entry to determine
          grossProceeds: 0, // Would need OCR or manual entry to extract
          basisReportedToIRS: false, // Default assumption for crypto
          shortTermBox: 'H' as const,
          longTermBox: 'K' as const,
          hasShortTerm: true,
          hasLongTerm: true,
          taxYear,
        }));

        // Calculate using FIFO (boxes will be determined by our holding period calculations)
        const calcResult = calculateFIFO(allParsedTransactions, taxYear, form1099DAs);

        // Only validate if 1099-DA forms were provided
        const discrepancies = form1099DAs.length > 0 && calcResult.taxSummary
          ? validate1099DAAgainstCalculations(form1099DAs, calcResult.taxSummary, allParsedTransactions)
          : [];

        // Add a warning if no 1099-DA was uploaded
        if (files.form1099DAFiles.length === 0) {
          allWarnings.push('No 1099-DA form uploaded - proceeding without validation. Consider uploading your 1099-DA form to verify accuracy.');
        }

        // Build result with 1099-DA data and validation
        const resultWithForms: ProcessingResult = {
          ...calcResult,
          form1099DAs: form1099DAs.length > 0 ? form1099DAs : undefined,
          discrepancies: discrepancies.length > 0 ? discrepancies : undefined,
        };

        // Convert discrepancies to warnings/errors
        const discrepancyWarnings = discrepancies
          .filter(d => d.severity === 'warning')
          .map(d => d.message);
        const discrepancyErrors = discrepancies
          .filter(d => d.severity === 'error')
          .map(d => d.message);

        setResult(resultWithForms);
        setWarnings([...allWarnings, ...calcResult.warnings, ...discrepancyWarnings]);
        setErrors([...allErrors, ...calcResult.errors, ...discrepancyErrors]);
      } catch (error) {
        setErrors([`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
      } finally {
        setIsProcessing(false);
      }
    },
    [taxYear]
  );

  const resetCalculator = () => {
    setResult(null);
    setAllTransactions([]);
    setErrors([]);
    setWarnings([]);
    setActiveTab('summary');
  };

  // Show disclaimer acceptance screen first
  if (!hasAcceptedDisclaimer) {
    return (
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <img
              src="/costbasis-logo.png"
              alt="CostBasis"
              className="h-10 mx-auto mb-4"
            />
            <p className="text-gray-700 text-xl font-medium">
              Don't overpay the IRS for your crypto gains.
            </p>
          </div>

          {/* Privacy Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">100% Client-Side</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">No Subscription Required</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <Lock className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">Data Never Leaves Your Device</span>
            </div>
          </div>

          {/* 3-Step Guide */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-green-600" />
                </div>
                <div className="mb-2">
                  <span className="font-bold text-green-600">Step 1:</span>{' '}
                  <span className="font-semibold text-gray-900">Export</span>
                </div>
                <p className="text-sm text-gray-600">
                  Log into your exchange and download your <strong>All-Time</strong> transaction history CSV
                  (we can handle multiple CSVs if that's easiest for you).
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <div className="mb-2">
                  <span className="font-bold text-blue-600">Step 2:</span>{' '}
                  <span className="font-semibold text-gray-900">Upload</span>
                </div>
                <p className="text-sm text-gray-600">
                  Drag and drop your files. Our code runs locally; your data never leaves your device.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileCheck className="w-8 h-8 text-purple-600" />
                </div>
                <div className="mb-2">
                  <span className="font-bold text-purple-600">Step 3:</span>{' '}
                  <span className="font-semibold text-gray-900">Review</span>
                </div>
                <p className="text-sm text-gray-600">
                  See your calculated gains and download your filing-ready Form 8949.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setHasAcceptedDisclaimer(true)}
            className="w-full px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition-all shadow-lg hover:scale-[1.02]"
          >
            Get Started
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <img
            src="/costbasis-logo.png"
            alt="CostBasis"
            className="h-10 mx-auto mb-4"
          />
          <p className="text-gray-700 text-lg font-medium">
            Don't overpay the IRS for your crypto gains.
          </p>
        </header>

        {/* Tax Year Selector */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <label htmlFor="taxYear" className="text-sm font-medium text-gray-700">
              Tax Year:
            </label>
            <select
              id="taxYear"
              value={taxYear}
              onChange={(e) => setTaxYear(parseInt(e.target.value))}
              className="border-0 bg-transparent font-semibold text-blue-600 focus:ring-0 cursor-pointer"
              disabled={result !== null}
            >
              {[2025, 2024, 2023, 2022, 2021].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content */}
        {!result ? (
          <>
            <FileUpload onFilesParsed={handleFilesParsed} isProcessing={isProcessing} />

            {errors.length > 0 && (
              <div className="mt-6 max-w-2xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Errors</h4>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Results Navigation */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'summary'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('form8949')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'form8949'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Form 8949
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'guide'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Tax Software Guide
              </button>
              <button
                onClick={resetCalculator}
                className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Start Over
              </button>
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 mb-2">Warnings</h4>
                <ul className="list-disc list-inside text-sm text-amber-700 space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tab Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {activeTab === 'summary' && result.taxSummary && (() => {
                // Calculate date range from transactions
                const dates = allTransactions.map(t => t.timestamp);
                const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
                const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

                return (
                  <TaxSummary
                    summary={result.taxSummary}
                    isUnlocked={isUnlocked}
                    onUnlock={() => setIsUnlocked(true)}
                    transactionCount={allTransactions.length}
                    dateRange={minDate && maxDate ? { min: minDate, max: maxDate } : undefined}
                  />
                );
              })()}
              {activeTab === 'form8949' && result.taxSummary && (
                <Form8949
                  summary={result.taxSummary}
                  isUnlocked={isUnlocked}
                  onUnlock={() => setIsUnlocked(true)}
                />
              )}
              {activeTab === 'guide' && result.taxSummary && (
                <TaxSoftwareGuide
                  summary={result.taxSummary}
                  isUnlocked={isUnlocked}
                  onUnlock={() => setIsUnlocked(true)}
                />
              )}
            </div>
          </>
        )}

        {/* Footer Disclaimer */}
        <CompactDisclaimer />
      </div>
    </main>
  );
}
