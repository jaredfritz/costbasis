'use client';

import React, { useState } from 'react';
import { FileDown, ChevronRight } from 'lucide-react';

type ExchangeTab = 'coinbase' | 'cryptocom' | 'binance' | 'kraken' | 'other';

export default function CSVInstructionTabs() {
  const [activeTab, setActiveTab] = useState<ExchangeTab>('coinbase');

  const instructions = {
    coinbase: [
      'Log into your Coinbase account',
      'Go to Settings → Taxes',
      'Under Documents, select Generate Report',
      'Choose CSV format',
      'Critical: Select "All-Time" to ensure we have your original purchase data',
    ],
    cryptocom: [
      'Open the Crypto.com App',
      'Tap Accounts (bottom menu) → Transaction History (clock icon, top right)',
      'Tap the Export icon (top right)',
      'Choose "Export to CSV"',
      'Critical: Select "All Time" and tap Download',
    ],
    binance: [
      'Go to Wallet → Transaction History',
      'Click Export Transaction Records',
      'Select your desired date range (choose "All" or custom ranges to cover your full history)',
      'Generate and download the CSV',
    ],
    kraken: [
      'Go to History → Export',
      'Select "Ledgers" (Recommended) or "Trades"',
      'Ensure the date range covers your entire account history',
      'Submit the request and download the CSV',
    ],
    other: [
      'Trade elsewhere? No problem',
      'Upload your CSV and use our Universal Mapper to identify your columns in the next step',
    ],
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FileDown className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">How to Export Your CSV</h3>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveTab('coinbase')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'coinbase'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Coinbase
        </button>
        <button
          onClick={() => setActiveTab('cryptocom')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'cryptocom'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Crypto.com
        </button>
        <button
          onClick={() => setActiveTab('binance')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'binance'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Binance
        </button>
        <button
          onClick={() => setActiveTab('kraken')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'kraken'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Kraken
        </button>
        <button
          onClick={() => setActiveTab('other')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'other'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Other
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-lg p-4">
        <ol className="space-y-2">
          {instructions[activeTab].map((instruction, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </span>
              <span className="text-gray-700 pt-0.5">{instruction}</span>
            </li>
          ))}
        </ol>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            Make sure to select <strong>All-Time</strong> for complete transaction history
          </p>
        </div>
      </div>
    </div>
  );
}
