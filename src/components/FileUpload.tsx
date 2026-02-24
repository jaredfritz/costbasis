'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, CheckCircle, FileBarChart, AlertCircle } from 'lucide-react';

interface FileWithType {
  file: File;
  type: 'csv' | '1099-da';
}

interface FileUploadProps {
  onFilesParsed: (files: {
    csvFiles: { name: string; content: string }[];
    form1099DAFiles: { name: string; file: File }[];
  }) => void;
  isProcessing: boolean;
}

export default function FileUpload({ onFilesParsed, isProcessing }: FileUploadProps) {
  const [files, setFiles] = useState<FileWithType[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const categorizeFile = (file: File): 'csv' | '1099-da' | null => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      return 'csv';
    }
    if (
      file.type === 'application/pdf' ||
      file.name.endsWith('.pdf') ||
      file.type.startsWith('image/') ||
      ['.jpg', '.jpeg', '.png'].some(ext => file.name.toLowerCase().endsWith(ext))
    ) {
      return '1099-da';
    }
    return null;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files)
      .map(file => {
        const type = categorizeFile(file);
        return type ? { file, type } : null;
      })
      .filter((item): item is FileWithType => item !== null);

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
      .map(file => {
        const type = categorizeFile(file);
        return type ? { file, type } : null;
      })
      .filter((item): item is FileWithType => item !== null);

    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const processFiles = useCallback(async () => {
    const csvFiles: { name: string; content: string }[] = [];
    const form1099DAFiles: { name: string; file: File }[] = [];

    for (const { file, type } of files) {
      if (type === 'csv') {
        const content = await file.text();
        csvFiles.push({ name: file.name, content });
      } else if (type === '1099-da') {
        form1099DAFiles.push({ name: file.name, file });
      }
    }

    onFilesParsed({ csvFiles, form1099DAFiles });
  }, [files, onFilesParsed]);

  const csvFileCount = files.filter(f => f.type === 'csv').length;
  const form1099DACount = files.filter(f => f.type === '1099-da').length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Instructions - Exchange-specific dropdowns */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="w-full">
            <h3 className="font-semibold text-blue-900 mb-2">Where to Find Your Files</h3>
            <p className="text-sm text-blue-800 mb-4">
              Upload your <strong>transaction history (CSV)</strong> and optionally your <strong>1099-DA form</strong> for validation.
            </p>

            {/* Exchange-specific instructions */}
            <div className="space-y-2">
              {/* Crypto.com */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-blue-900 hover:text-blue-700 flex items-center gap-2">
                  <span className="text-blue-600">▸</span> Crypto.com
                </summary>
                <div className="mt-2 ml-4 pl-4 border-l-2 border-blue-200 text-sm text-blue-800 space-y-2">
                  <div>
                    <p className="font-medium">1099-DA Form:</p>
                    <p>Visit <a href="https://crypto.com/1099form" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">crypto.com/1099form</a></p>
                  </div>
                  <div>
                    <p className="font-medium">Transaction History CSV:</p>
                    <p>Crypto.com app → Accounts → Transaction History (clock with $ icon) → Crypto Wallet → Export → Transaction = Crypto Wallet, From = as early as possible, To: December 31, 2025</p>
                    <p className="text-xs italic mt-1">Note: Crypto.com may limit downloads to 3 years at a time, requiring multiple exports.</p>
                  </div>
                </div>
              </details>

              {/* Coinbase */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-blue-900 hover:text-blue-700 flex items-center gap-2">
                  <span className="text-blue-600">▸</span> Coinbase
                </summary>
                <div className="mt-2 ml-4 pl-4 border-l-2 border-blue-200 text-sm text-blue-800 space-y-2">
                  <div>
                    <p className="font-medium">1099-DA Form:</p>
                    <p>
                      <a href="https://www.coinbase.com/settings/tax-documents" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600">
                        Account → Settings → Tax Documents
                      </a>
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Transaction History CSV:</p>
                    <p>Coinbase.com → Portfolio → My Assets → (⋯) → Export → Transaction history → Generate report</p>
                  </div>
                </div>
              </details>

              {/* Binance */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-blue-900 hover:text-blue-700 flex items-center gap-2">
                  <span className="text-blue-600">▸</span> Binance.US
                </summary>
                <div className="mt-2 ml-4 pl-4 border-l-2 border-blue-200 text-sm text-blue-800 space-y-2">
                  <div>
                    <p className="font-medium">1099-DA Form:</p>
                    <p>Binance.US → Account → Tax Documents</p>
                  </div>
                  <div>
                    <p className="font-medium">Transaction History CSV:</p>
                    <p>Binance.US → Wallet → Transaction History → Generate Statement</p>
                  </div>
                </div>
              </details>

              {/* Kraken */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-blue-900 hover:text-blue-700 flex items-center gap-2">
                  <span className="text-blue-600">▸</span> Kraken
                </summary>
                <div className="mt-2 ml-4 pl-4 border-l-2 border-blue-200 text-sm text-blue-800 space-y-2">
                  <div>
                    <p className="font-medium">1099-DA Form:</p>
                    <p>Kraken.com → Account → Tax Center → Download 1099</p>
                  </div>
                  <div>
                    <p className="font-medium">Transaction History CSV:</p>
                    <p>Kraken.com → History → Export → Select date range → Download CSV</p>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv,.pdf,.jpg,.jpeg,.png"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Drop your transaction history (CSV) and 1099-DA forms here
        </h3>
        <p className="text-sm text-gray-500">
          Or click to browse • Accepts CSV, PDF, and image files
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Selected files ({files.length})
          </h4>

          {files.map(({ file, type }, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {type === 'csv' ? (
                  <FileText className="w-5 h-5 text-blue-500" />
                ) : (
                  <FileBarChart className="w-5 h-5 text-purple-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {file.name}
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {type === 'csv' ? 'Transactions' : '1099-DA'}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <button
                onClick={() => removeFile(index)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}

          {csvFileCount === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-amber-800">
                <strong>Transaction CSV required</strong> - Please upload at least one CSV file to continue
              </p>
            </div>
          )}

          {csvFileCount > 0 && form1099DACount === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-blue-800">
                <strong>Optional:</strong> Upload your 1099-DA form for validation, or continue without it
              </p>
            </div>
          )}

          <button
            onClick={processFiles}
            disabled={isProcessing || csvFileCount === 0}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                {csvFileCount === 0 ? (
                  <>Upload CSV to Continue</>
                ) : form1099DACount > 0 ? (
                  <>Calculate Cost Basis ({csvFileCount} CSV, {form1099DACount} 1099-DA)</>
                ) : (
                  <>Calculate Cost Basis ({csvFileCount} CSV)</>
                )}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
