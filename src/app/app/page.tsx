'use client';

import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { Calculator, Shield, FileText, HelpCircle, Download, Upload, FileCheck } from 'lucide-react';
import { FileUpload, TaxSummary, Form8949, TaxSoftwareGuide, Disclaimer, CompactDisclaimer, Form1099DAEntry } from '@/components';
import { parseCSV, preprocessCoinbaseCSV } from '@/lib/parsers';
import { calculateFIFO } from '@/lib/calculator';
import { validate1099DAAgainstCalculations } from '@/lib/validation';
import { TaxSummary as TaxSummaryType, NormalizedTransaction, ProcessingResult, Form1099DA, Form1099DAManualEntry } from '@/lib/types';

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

  // 1099-DA state
  const [pending1099DAFiles, setPending1099DAFiles] = useState<{ name: string; file: File }[]>([]);
  const [current1099DAIndex, setCurrent1099DAIndex] = useState<number | null>(null);
  const [collected1099DAs, setCollected1099DAs] = useState<Form1099DA[]>([]);
  const [pendingCSVFiles, setPendingCSVFiles] = useState<{ name: string; content: string }[]>([]);

  const handleFilesParsed = useCallback(
    async (files: { csvFiles: { name: string; content: string }[]; form1099DAFiles: { name: string; file: File }[] }) => {
      setErrors([]);
      setWarnings([]);

      // Store the files and start the 1099-DA entry workflow
      setPendingCSVFiles(files.csvFiles);
      setPending1099DAFiles(files.form1099DAFiles);

      if (files.form1099DAFiles.length > 0) {
        // Start with the first 1099-DA file
        setCurrent1099DAIndex(0);
      } else {
        // If no 1099-DA files, show error (they're required)
        setErrors(['1099-DA forms are required. Please upload your 1099-DA forms from your exchange(s).']);
      }
    },
    []
  );

  const handle1099DASubmit = useCallback((data: Form1099DAManualEntry) => {
    if (current1099DAIndex === null) return;

    const currentFile = pending1099DAFiles[current1099DAIndex];

    // Create Form1099DA object
    const form1099DA: Form1099DA = {
      fileName: currentFile.name,
      exchange: data.exchange,
      grossProceeds: data.grossProceeds,
      basisReportedToIRS: data.basisReportedToIRS,
      shortTermBox: data.basisReportedToIRS ? 'G' : 'H',
      longTermBox: data.basisReportedToIRS ? 'J' : 'K',
      hasShortTerm: data.hasShortTerm,
      hasLongTerm: data.hasLongTerm,
      taxYear,
    };

    // Add to collected forms
    const newCollected = [...collected1099DAs, form1099DA];
    setCollected1099DAs(newCollected);

    // Move to next file or process if done
    if (current1099DAIndex + 1 < pending1099DAFiles.length) {
      setCurrent1099DAIndex(current1099DAIndex + 1);
    } else {
      // All 1099-DAs collected, now process the CSVs
      setCurrent1099DAIndex(null);
      processTransactions(pendingCSVFiles, newCollected);
    }
  }, [current1099DAIndex, pending1099DAFiles, collected1099DAs, taxYear, pendingCSVFiles]);

  const handle1099DACancel = useCallback(() => {
    // Reset the workflow
    setCurrent1099DAIndex(null);
    setPending1099DAFiles([]);
    setPendingCSVFiles([]);
    setCollected1099DAs([]);
    setErrors(['1099-DA entry cancelled. Please upload your files again.']);
  }, []);

  const processTransactions = useCallback(
    async (csvFiles: { name: string; content: string }[], form1099DAs: Form1099DA[]) => {
      setIsProcessing(true);
      setErrors([]);
      setWarnings([]);

      try {
        const allParsedTransactions: NormalizedTransaction[] = [];
        const allWarnings: string[] = [];
        const allErrors: string[] = [];

        for (const file of csvFiles) {
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

        // Calculate using FIFO with 1099-DA data
        const calcResult = calculateFIFO(allParsedTransactions, taxYear, form1099DAs);

        // Validate 1099-DA forms against calculated results
        const discrepancies = calcResult.taxSummary
          ? validate1099DAAgainstCalculations(form1099DAs, calcResult.taxSummary, allParsedTransactions)
          : [];

        // Build result with 1099-DA data and validation
        const resultWithForms: ProcessingResult = {
          ...calcResult,
          form1099DAs,
          discrepancies,
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
    setPending1099DAFiles([]);
    setCurrent1099DAIndex(null);
    setCollected1099DAs([]);
    setPendingCSVFiles([]);
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
            <p className="text-gray-600 text-lg">
              Calculate your true cost basis for your crypto transactions
            </p>
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
          <p className="text-gray-600">
            Upload your transaction history to calculate cost basis to ensure you don't overpay.
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
              {activeTab === 'summary' && result.taxSummary && (
                <TaxSummary
                  summary={result.taxSummary}
                  isUnlocked={isUnlocked}
                  onUnlock={() => setIsUnlocked(true)}
                  transactionCount={allTransactions.length}
                />
              )}
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

      {/* 1099-DA Entry Modal */}
      {current1099DAIndex !== null && pending1099DAFiles[current1099DAIndex] && (
        <Form1099DAEntry
          fileName={pending1099DAFiles[current1099DAIndex].name}
          fileUrl={URL.createObjectURL(pending1099DAFiles[current1099DAIndex].file)}
          onSubmit={handle1099DASubmit}
          onCancel={handle1099DACancel}
        />
      )}
    </main>
  );
}
