'use client';

import React, { useState } from 'react';
import { X, FileText, HelpCircle } from 'lucide-react';
import { Form1099DAManualEntry } from '@/lib/types';

interface Form1099DAEntryProps {
  fileName: string;
  fileUrl?: string; // Preview URL for the uploaded file
  onSubmit: (data: Form1099DAManualEntry) => void;
  onCancel: () => void;
}

export default function Form1099DAEntry({ fileName, fileUrl, onSubmit, onCancel }: Form1099DAEntryProps) {
  const [formData, setFormData] = useState<Form1099DAManualEntry>({
    exchange: '',
    grossProceeds: 0,
    basisReportedToIRS: false,
    hasShortTerm: false,
    hasLongTerm: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.exchange.trim()) {
      newErrors.exchange = 'Exchange name is required';
    }

    if (formData.grossProceeds <= 0) {
      newErrors.grossProceeds = 'Gross proceeds must be greater than 0';
    }

    if (!formData.hasShortTerm && !formData.hasLongTerm) {
      newErrors.holdingPeriod = 'Select at least one holding period';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Enter 1099-DA Information</h2>
              <p className="text-sm text-gray-500">{fileName}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Form Side */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Exchange Name */}
                <div>
                  <label htmlFor="exchange" className="block text-sm font-medium text-gray-700 mb-2">
                    Exchange/Broker Name *
                  </label>
                  <input
                    type="text"
                    id="exchange"
                    value={formData.exchange}
                    onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.exchange ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Coinbase, Crypto.com"
                  />
                  {errors.exchange && (
                    <p className="text-sm text-red-600 mt-1">{errors.exchange}</p>
                  )}
                </div>

                {/* Gross Proceeds */}
                <div>
                  <label htmlFor="grossProceeds" className="block text-sm font-medium text-gray-700 mb-2">
                    Gross Proceeds (Box 1a) *
                    <button
                      type="button"
                      className="ml-2 inline-flex items-center text-blue-600 hover:text-blue-700"
                      title="Total amount from sales of digital assets"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="grossProceeds"
                      step="0.01"
                      value={formData.grossProceeds || ''}
                      onChange={(e) => setFormData({ ...formData, grossProceeds: parseFloat(e.target.value) || 0 })}
                      className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.grossProceeds ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.grossProceeds && (
                    <p className="text-sm text-red-600 mt-1">{errors.grossProceeds}</p>
                  )}
                </div>

                {/* Basis Reported to IRS */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Was cost basis reported to the IRS? *
                    <button
                      type="button"
                      className="ml-2 inline-flex items-center text-blue-600 hover:text-blue-700"
                      title="Check your 1099-DA form - there should be a checkbox or notation indicating if basis was reported"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="basisReported"
                        checked={formData.basisReportedToIRS === true}
                        onChange={() => setFormData({ ...formData, basisReportedToIRS: true })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">Yes, reported</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="basisReported"
                        checked={formData.basisReportedToIRS === false}
                        onChange={() => setFormData({ ...formData, basisReportedToIRS: false })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">No, not reported</span>
                    </label>
                  </div>
                </div>

                {/* Holding Periods */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Holding Period(s) *
                    <button
                      type="button"
                      className="ml-2 inline-flex items-center text-blue-600 hover:text-blue-700"
                      title="Check which section(s) of your 1099-DA have transactions"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasShortTerm}
                        onChange={(e) => setFormData({ ...formData, hasShortTerm: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Short-term (≤ 1 year)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasLongTerm}
                        onChange={(e) => setFormData({ ...formData, hasLongTerm: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Long-term (&gt; 1 year)</span>
                    </label>
                  </div>
                  {errors.holdingPeriod && (
                    <p className="text-sm text-red-600 mt-1">{errors.holdingPeriod}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Save 1099-DA Data
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Side */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Reference Your 1099-DA</h3>

              {fileUrl ? (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  {fileName.toLowerCase().endsWith('.pdf') ? (
                    <div className="text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">PDF Preview</p>
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Open in new tab
                      </a>
                    </div>
                  ) : (
                    <img
                      src={fileUrl}
                      alt="1099-DA Preview"
                      className="w-full h-auto rounded"
                    />
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Have your 1099-DA form handy and enter the information on the left
                  </p>
                </div>
              )}

              {/* Helper Info */}
              <div className="mt-6 space-y-3 text-sm">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="font-medium text-blue-900 mb-1">💡 Where to find this info:</p>
                  <ul className="text-blue-800 space-y-1 text-xs">
                    <li><strong>Exchange:</strong> Top of form, payer information</li>
                    <li><strong>Gross Proceeds:</strong> Box 1a (total sales amount)</li>
                    <li><strong>Basis Reported:</strong> Look for checkbox or note near boxes G-L</li>
                    <li><strong>Holding Period:</strong> Check which sections have amounts</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
