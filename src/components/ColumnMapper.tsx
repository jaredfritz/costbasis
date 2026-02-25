'use client';

import React, { useState, useMemo } from 'react';
import { ArrowRight, Check, AlertCircle } from 'lucide-react';

interface ColumnMapping {
  timestamp?: string;
  type?: string;
  asset?: string;
  amount?: string;
  usdValue?: string;
  fee?: string;
}

interface ColumnMapperProps {
  csvData: Record<string, string>[];
  headers: string[];
  onMappingComplete: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}

export default function ColumnMapper({ csvData, headers, onMappingComplete, onCancel }: ColumnMapperProps) {
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [showPreview, setShowPreview] = useState(false);

  // Auto-suggest mappings based on column names
  const suggestedMappings = useMemo(() => {
    const suggestions: ColumnMapping = {};

    headers.forEach(header => {
      const lowerHeader = header.toLowerCase();

      // Timestamp detection
      if ((lowerHeader.includes('date') || lowerHeader.includes('time') || lowerHeader.includes('timestamp')) && !suggestions.timestamp) {
        suggestions.timestamp = header;
      }

      // Type detection
      if ((lowerHeader.includes('type') || lowerHeader.includes('side') || lowerHeader.includes('transaction')) && !lowerHeader.includes('asset') && !suggestions.type) {
        suggestions.type = header;
      }

      // Asset detection
      if ((lowerHeader.includes('asset') || lowerHeader.includes('coin') || lowerHeader.includes('currency') || lowerHeader.includes('symbol')) && !lowerHeader.includes('native') && !suggestions.asset) {
        suggestions.asset = header;
      }

      // Amount detection
      if ((lowerHeader.includes('amount') || lowerHeader.includes('quantity') || lowerHeader.includes('volume') || lowerHeader.includes('vol')) && !lowerHeader.includes('usd') && !lowerHeader.includes('total') && !suggestions.amount) {
        suggestions.amount = header;
      }

      // USD value detection
      if ((lowerHeader.includes('usd') || lowerHeader.includes('price') || lowerHeader.includes('total') || lowerHeader.includes('cost')) && !lowerHeader.includes('fee') && !suggestions.usdValue) {
        suggestions.usdValue = header;
      }

      // Fee detection
      if (lowerHeader.includes('fee') && !suggestions.fee) {
        suggestions.fee = header;
      }
    });

    return suggestions;
  }, [headers]);

  // Apply suggested mappings on first render
  React.useEffect(() => {
    if (Object.keys(mapping).length === 0) {
      setMapping(suggestedMappings);
    }
  }, [suggestedMappings]);

  const isValid = mapping.timestamp && mapping.type && mapping.asset && mapping.amount;

  const previewData = useMemo(() => {
    if (!isValid) return [];

    return csvData.slice(0, 5).map(row => ({
      timestamp: mapping.timestamp ? row[mapping.timestamp] : '',
      type: mapping.type ? row[mapping.type] : '',
      asset: mapping.asset ? row[mapping.asset] : '',
      amount: mapping.amount ? row[mapping.amount] : '',
      usdValue: mapping.usdValue ? row[mapping.usdValue] : '',
      fee: mapping.fee ? row[mapping.fee] : '',
    }));
  }, [csvData, mapping, isValid]);

  const handleFieldSelect = (field: keyof ColumnMapping, header: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: header === prev[field] ? undefined : header
    }));
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#1A2B3C] mb-2">
          Map Your CSV Columns
        </h2>
        <p className="text-gray-600">
          We couldn't automatically detect the format of your CSV. Please map your columns to the required fields below.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Unsupported Exchange:</strong> Your CSV doesn't match any of our supported formats (Coinbase, Binance, Kraken, Gemini, Crypto.com). Manual mapping allows you to use data from other exchanges, but results may be less accurate. Consider uploading data from a supported exchange for best results.
        </div>
      </div>

      {/* Required Fields */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[#1A2B3C]">Required Fields</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldSelector
            label="Date/Time"
            description="When the transaction occurred"
            required
            headers={headers}
            selectedHeader={mapping.timestamp}
            onSelect={(header) => handleFieldSelect('timestamp', header)}
          />

          <FieldSelector
            label="Transaction Type"
            description="Buy, Sell, Trade, etc."
            required
            headers={headers}
            selectedHeader={mapping.type}
            onSelect={(header) => handleFieldSelect('type', header)}
          />

          <FieldSelector
            label="Asset/Coin"
            description="BTC, ETH, etc."
            required
            headers={headers}
            selectedHeader={mapping.asset}
            onSelect={(header) => handleFieldSelect('asset', header)}
          />

          <FieldSelector
            label="Amount/Quantity"
            description="How much crypto"
            required
            headers={headers}
            selectedHeader={mapping.amount}
            onSelect={(header) => handleFieldSelect('amount', header)}
          />
        </div>
      </div>

      {/* Optional Fields */}
      <div className="space-y-4">
        <h3 className="font-semibold text-[#1A2B3C]">Optional Fields</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldSelector
            label="USD Value"
            description="Total USD cost or proceeds"
            headers={headers}
            selectedHeader={mapping.usdValue}
            onSelect={(header) => handleFieldSelect('usdValue', header)}
          />

          <FieldSelector
            label="Fee"
            description="Transaction fee in USD"
            headers={headers}
            selectedHeader={mapping.fee}
            onSelect={(header) => handleFieldSelect('fee', header)}
          />
        </div>
      </div>

      {/* Preview */}
      {isValid && showPreview && (
        <div className="space-y-3">
          <h3 className="font-semibold text-[#1A2B3C]">Preview (First 5 rows)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">USD Value</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewData.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-gray-900">{row.timestamp}</td>
                    <td className="px-3 py-2 text-gray-900">{row.type}</td>
                    <td className="px-3 py-2 text-gray-900">{row.asset}</td>
                    <td className="px-3 py-2 text-gray-900">{row.amount}</td>
                    <td className="px-3 py-2 text-gray-900">{row.usdValue || '-'}</td>
                    <td className="px-3 py-2 text-gray-900">{row.fee || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        {isValid && !showPreview && (
          <button
            onClick={() => setShowPreview(true)}
            className="px-6 py-2 bg-gray-100 text-[#1A2B3C] font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Preview Data
          </button>
        )}

        <button
          onClick={() => onMappingComplete(mapping)}
          disabled={!isValid}
          className={`px-6 py-2 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
            isValid
              ? 'bg-[#22C55E] text-white hover:bg-[#22C55E]/90'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isValid ? (
            <>
              Continue <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            'Select Required Fields'
          )}
        </button>

        <button
          onClick={onCancel}
          className="px-6 py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

interface FieldSelectorProps {
  label: string;
  description: string;
  required?: boolean;
  headers: string[];
  selectedHeader?: string;
  onSelect: (header: string) => void;
}

function FieldSelector({ label, description, required, headers, selectedHeader, onSelect }: FieldSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-sm font-medium text-[#1A2B3C]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
        <span className="block text-xs text-gray-500 mt-0.5">{description}</span>
      </label>

      <select
        value={selectedHeader || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#22C55E] focus:border-transparent"
      >
        <option value="">Select column...</option>
        {headers.map(header => (
          <option key={header} value={header}>
            {header}
          </option>
        ))}
      </select>

      {selectedHeader && (
        <div className="flex items-center gap-1.5 text-xs text-[#22C55E]">
          <Check className="w-3 h-3" />
          <span>Mapped to: {selectedHeader}</span>
        </div>
      )}
    </div>
  );
}
