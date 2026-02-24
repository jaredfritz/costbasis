'use client';

import React, { useRef } from 'react';
import { TaxSummary } from '@/lib/types';
import { Download, Printer, Lock } from 'lucide-react';

interface Form8949Props {
  summary: TaxSummary;
  isUnlocked?: boolean;
  onUnlock?: () => void;
}

export default function Form8949({ summary, isUnlocked = false, onUnlock }: Form8949Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Blurred value component for locked state - uses backdrop blur for premium feel
  const BlurredValue = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    if (isUnlocked) {
      return <span className={className}>{children}</span>;
    }
    return (
      <span className={`${className} relative inline-block`}>
        <span className="select-none opacity-70">{children}</span>
        <span className="absolute inset-0 backdrop-blur-[6px] bg-white/30" aria-hidden="true"></span>
      </span>
    );
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    // Create a new window with just the Form 8949 content
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups to print the form.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Form 8949 - Tax Year ${summary.taxYear}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 12px;
              line-height: 1.4;
              color: #1f2937;
              padding: 20px;
            }
            .header {
              background: #1f2937;
              color: white;
              padding: 16px;
              margin: -20px -20px 20px -20px;
            }
            .header h1 {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 4px;
            }
            .header p {
              font-size: 12px;
              color: #d1d5db;
            }
            .section {
              margin-bottom: 24px;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              overflow: hidden;
            }
            .section-header {
              padding: 12px;
              border-bottom: 1px solid #e5e7eb;
            }
            .section-header h2 {
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .section-header p {
              font-size: 11px;
              color: #6b7280;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 11px;
            }
            th {
              background: #f9fafb;
              padding: 8px;
              text-align: left;
              font-weight: 600;
              border-bottom: 1px solid #e5e7eb;
            }
            th.right, td.right {
              text-align: right;
            }
            td {
              padding: 8px;
              border-bottom: 1px solid #f3f4f6;
            }
            .mono {
              font-family: ui-monospace, monospace;
            }
            .totals {
              background: #f9fafb;
              font-weight: 600;
            }
            .gain { color: #059669; }
            .loss { color: #dc2626; }
            .footer {
              padding: 12px;
              background: #f9fafb;
              font-size: 10px;
              color: #6b7280;
            }
            .footer p {
              margin-bottom: 4px;
            }
            .summary-box {
              margin-top: 20px;
              padding: 16px;
              border: 2px solid #1f2937;
              border-radius: 4px;
            }
            .summary-box h3 {
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 12px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
            }
            .summary-row.total {
              border-top: 1px solid #e5e7eb;
              margin-top: 8px;
              padding-top: 8px;
              font-weight: 600;
            }
            @media print {
              body { padding: 0; }
              .header { margin: 0 0 20px 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Form 8949</h1>
            <p>Sales and Other Dispositions of Capital Assets — Tax Year ${summary.taxYear}</p>
          </div>

          <div class="section">
            <div class="section-header">
              <h2>Part I — Short-Term Capital Gains and Losses</h2>
              <p>☑ Box B: Short-term transactions reported on Form 1099-DA with basis <strong>not reported</strong> to the IRS</p>
            </div>
            ${summary.shortTerm.entries.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>(a) Description</th>
                    <th>(b) Date Acquired</th>
                    <th>(c) Date Sold</th>
                    <th class="right">(d) Proceeds</th>
                    <th class="right">(e) Cost Basis</th>
                    <th class="right">(h) Gain/(Loss)</th>
                  </tr>
                </thead>
                <tbody>
                  ${summary.shortTerm.entries.map(entry => `
                    <tr>
                      <td class="mono">${entry.description}</td>
                      <td>${entry.dateAcquired}</td>
                      <td>${entry.dateSold}</td>
                      <td class="right mono">${formatCurrency(entry.proceeds)}</td>
                      <td class="right mono">${formatCurrency(entry.costBasis)}</td>
                      <td class="right mono ${entry.gainLoss >= 0 ? 'gain' : 'loss'}">${formatCurrency(entry.gainLoss)}</td>
                    </tr>
                  `).join('')}
                  <tr class="totals">
                    <td colspan="3">Part I Totals</td>
                    <td class="right mono">${formatCurrency(summary.shortTerm.totalProceeds)}</td>
                    <td class="right mono">${formatCurrency(summary.shortTerm.totalCostBasis)}</td>
                    <td class="right mono ${summary.shortTerm.totalGainLoss >= 0 ? 'gain' : 'loss'}">${formatCurrency(summary.shortTerm.totalGainLoss)}</td>
                  </tr>
                </tbody>
              </table>
            ` : '<p style="padding: 12px; color: #6b7280; font-style: italic;">No short-term transactions.</p>'}
          </div>

          <div class="section">
            <div class="section-header">
              <h2>Part II — Long-Term Capital Gains and Losses</h2>
              <p>☑ Box E: Long-term transactions reported on Form 1099-DA with basis <strong>not reported</strong> to the IRS</p>
            </div>
            ${summary.longTerm.entries.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    <th>(a) Description</th>
                    <th>(b) Date Acquired</th>
                    <th>(c) Date Sold</th>
                    <th class="right">(d) Proceeds</th>
                    <th class="right">(e) Cost Basis</th>
                    <th class="right">(h) Gain/(Loss)</th>
                  </tr>
                </thead>
                <tbody>
                  ${summary.longTerm.entries.map(entry => `
                    <tr>
                      <td class="mono">${entry.description}</td>
                      <td>${entry.dateAcquired}</td>
                      <td>${entry.dateSold}</td>
                      <td class="right mono">${formatCurrency(entry.proceeds)}</td>
                      <td class="right mono">${formatCurrency(entry.costBasis)}</td>
                      <td class="right mono ${entry.gainLoss >= 0 ? 'gain' : 'loss'}">${formatCurrency(entry.gainLoss)}</td>
                    </tr>
                  `).join('')}
                  <tr class="totals">
                    <td colspan="3">Part II Totals</td>
                    <td class="right mono">${formatCurrency(summary.longTerm.totalProceeds)}</td>
                    <td class="right mono">${formatCurrency(summary.longTerm.totalCostBasis)}</td>
                    <td class="right mono ${summary.longTerm.totalGainLoss >= 0 ? 'gain' : 'loss'}">${formatCurrency(summary.longTerm.totalGainLoss)}</td>
                  </tr>
                </tbody>
              </table>
            ` : '<p style="padding: 12px; color: #6b7280; font-style: italic;">No long-term transactions.</p>'}
          </div>

          <div class="summary-box">
            <h3>Summary</h3>
            <div class="summary-row">
              <span>Total Proceeds:</span>
              <span class="mono">${formatCurrency(summary.totalProceeds)}</span>
            </div>
            <div class="summary-row">
              <span>Total Cost Basis:</span>
              <span class="mono">${formatCurrency(summary.totalCostBasis)}</span>
            </div>
            <div class="summary-row total">
              <span>Net Capital Gain/(Loss):</span>
              <span class="mono ${summary.netGainLoss >= 0 ? 'gain' : 'loss'}">${formatCurrency(summary.netGainLoss)}</span>
            </div>
          </div>

          <div class="footer" style="margin-top: 20px;">
            <p><strong>Method:</strong> FIFO (First In, First Out)</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
            <p style="margin-top: 8px; font-size: 9px;">
              This document is for informational purposes only and does not constitute tax advice.
              Consult a qualified tax professional for guidance specific to your situation.
            </p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      // Don't auto-close - let user close after printing
    }, 250);
  };

  const downloadAsText = () => {
    let content = `Form 8949: Sales and Other Dispositions of Capital Assets\n`;
    content += `Tax Year ${summary.taxYear}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    content += `${'='.repeat(80)}\n\n`;

    // Short-term
    content += `PART I — SHORT-TERM CAPITAL GAINS AND LOSSES\n`;
    content += `Box B: Short-term transactions with basis NOT reported to IRS\n\n`;

    if (summary.shortTerm.entries.length > 0) {
      content += `${'Description'.padEnd(30)} ${'Acquired'.padEnd(12)} ${'Sold'.padEnd(12)} ${'Proceeds'.padEnd(12)} ${'Basis'.padEnd(12)} ${'Gain/Loss'.padEnd(12)}\n`;
      content += `${'-'.repeat(90)}\n`;

      for (const entry of summary.shortTerm.entries) {
        content += `${entry.description.substring(0, 28).padEnd(30)} `;
        content += `${entry.dateAcquired.padEnd(12)} `;
        content += `${entry.dateSold.padEnd(12)} `;
        content += `${formatCurrency(entry.proceeds).padEnd(12)} `;
        content += `${formatCurrency(entry.costBasis).padEnd(12)} `;
        content += `${formatCurrency(entry.gainLoss)}\n`;
      }

      content += `${'-'.repeat(90)}\n`;
      content += `${'TOTALS'.padEnd(30)} ${''.padEnd(12)} ${''.padEnd(12)} `;
      content += `${formatCurrency(summary.shortTerm.totalProceeds).padEnd(12)} `;
      content += `${formatCurrency(summary.shortTerm.totalCostBasis).padEnd(12)} `;
      content += `${formatCurrency(summary.shortTerm.totalGainLoss)}\n`;
    } else {
      content += `No short-term transactions.\n`;
    }

    content += `\n${'='.repeat(80)}\n\n`;

    // Long-term
    content += `PART II — LONG-TERM CAPITAL GAINS AND LOSSES\n`;
    content += `Box E: Long-term transactions with basis NOT reported to IRS\n\n`;

    if (summary.longTerm.entries.length > 0) {
      content += `${'Description'.padEnd(30)} ${'Acquired'.padEnd(12)} ${'Sold'.padEnd(12)} ${'Proceeds'.padEnd(12)} ${'Basis'.padEnd(12)} ${'Gain/Loss'.padEnd(12)}\n`;
      content += `${'-'.repeat(90)}\n`;

      for (const entry of summary.longTerm.entries) {
        content += `${entry.description.substring(0, 28).padEnd(30)} `;
        content += `${entry.dateAcquired.padEnd(12)} `;
        content += `${entry.dateSold.padEnd(12)} `;
        content += `${formatCurrency(entry.proceeds).padEnd(12)} `;
        content += `${formatCurrency(entry.costBasis).padEnd(12)} `;
        content += `${formatCurrency(entry.gainLoss)}\n`;
      }

      content += `${'-'.repeat(90)}\n`;
      content += `${'TOTALS'.padEnd(30)} ${''.padEnd(12)} ${''.padEnd(12)} `;
      content += `${formatCurrency(summary.longTerm.totalProceeds).padEnd(12)} `;
      content += `${formatCurrency(summary.longTerm.totalCostBasis).padEnd(12)} `;
      content += `${formatCurrency(summary.longTerm.totalGainLoss)}\n`;
    } else {
      content += `No long-term transactions.\n`;
    }

    content += `\n${'='.repeat(80)}\n\n`;
    content += `SUMMARY\n`;
    content += `Total Proceeds: ${formatCurrency(summary.totalProceeds)}\n`;
    content += `Total Cost Basis: ${formatCurrency(summary.totalCostBasis)}\n`;
    content += `Net Capital Gain/Loss: ${formatCurrency(summary.netGainLoss)}\n`;
    content += `\n${'='.repeat(80)}\n`;
    content += `\nDISCLAIMER: This document is for informational purposes only and does not\n`;
    content += `constitute tax advice. Consult a qualified tax professional for your specific situation.\n`;
    content += `Cost basis calculated using FIFO method.\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Form8949_${summary.taxYear}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Unlock CTA for locked users - Updated messaging */}
      {!isUnlocked && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Your Form 8949 is Ready</h3>
                <p className="text-blue-100 text-sm">
                  Unlock to download, print, and file your complete tax report with all values revealed
                </p>
              </div>
            </div>
            <button
              onClick={onUnlock}
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors shadow-lg whitespace-nowrap"
            >
              Unlock for $9.99
            </button>
          </div>
        </div>
      )}

      {/* Action buttons - Disabled with lock icon until payment */}
      <div className="flex gap-3 mb-6 no-print">
        <button
          onClick={isUnlocked ? handlePrint : undefined}
          disabled={!isUnlocked}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            isUnlocked
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
          }`}
          title={!isUnlocked ? 'Unlock to enable printing' : 'Print Form 8949'}
        >
          <Printer className="w-4 h-4" />
          Print
          {!isUnlocked && <Lock className="w-3 h-3 ml-1" />}
        </button>
        <button
          onClick={isUnlocked ? downloadAsText : undefined}
          disabled={!isUnlocked}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            isUnlocked
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
          }`}
          title={!isUnlocked ? 'Unlock to enable downloads' : 'Download as TXT file'}
        >
          <Download className="w-4 h-4" />
          Download TXT
          {!isUnlocked && <Lock className="w-3 h-3 ml-1" />}
        </button>
      </div>

      {/* Form content */}
      <div ref={printRef} className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4">
          <h2 className="text-xl font-bold">Form 8949</h2>
          <p className="text-gray-300 text-sm">
            Sales and Other Dispositions of Capital Assets — Tax Year {summary.taxYear}
          </p>
        </div>

        {/* Part I - Short-Term */}
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Part I — Short-Term Capital Gains and Losses
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            ☑ Box B: Short-term transactions reported on Form 1099-DA with basis{' '}
            <strong>not reported</strong> to the IRS
          </p>

          {summary.shortTerm.entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="tax-table">
                <thead>
                  <tr>
                    <th>(a) Description</th>
                    <th>(b) Date Acquired</th>
                    <th>(c) Date Sold</th>
                    <th className="text-right">(d) Proceeds</th>
                    <th className="text-right">(e) Cost Basis</th>
                    <th className="text-right">(h) Gain/(Loss)</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.shortTerm.entries.map((entry, index) => (
                    <tr key={index}>
                      <td className="font-mono text-sm">{entry.description}</td>
                      <td>{entry.dateAcquired}</td>
                      <td>{entry.dateSold}</td>
                      <td className="text-right font-mono">
                        <BlurredValue>{formatCurrency(entry.proceeds)}</BlurredValue>
                      </td>
                      <td className="text-right font-mono">
                        <BlurredValue>{formatCurrency(entry.costBasis)}</BlurredValue>
                      </td>
                      <td
                        className={`text-right font-mono font-semibold ${
                          entry.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        <BlurredValue>{formatCurrency(entry.gainLoss)}</BlurredValue>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={3}>Part I Totals</td>
                    <td className="text-right font-mono">
                      <BlurredValue>{formatCurrency(summary.shortTerm.totalProceeds)}</BlurredValue>
                    </td>
                    <td className="text-right font-mono">
                      <BlurredValue>{formatCurrency(summary.shortTerm.totalCostBasis)}</BlurredValue>
                    </td>
                    <td
                      className={`text-right font-mono ${
                        summary.shortTerm.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      <BlurredValue>{formatCurrency(summary.shortTerm.totalGainLoss)}</BlurredValue>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No short-term transactions.</p>
          )}
        </div>

        {/* Part II - Long-Term */}
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Part II — Long-Term Capital Gains and Losses
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            ☑ Box E: Long-term transactions reported on Form 1099-DA with basis{' '}
            <strong>not reported</strong> to the IRS
          </p>

          {summary.longTerm.entries.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="tax-table">
                <thead>
                  <tr>
                    <th>(a) Description</th>
                    <th>(b) Date Acquired</th>
                    <th>(c) Date Sold</th>
                    <th className="text-right">(d) Proceeds</th>
                    <th className="text-right">(e) Cost Basis</th>
                    <th className="text-right">(h) Gain/(Loss)</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.longTerm.entries.map((entry, index) => (
                    <tr key={index}>
                      <td className="font-mono text-sm">{entry.description}</td>
                      <td>{entry.dateAcquired}</td>
                      <td>{entry.dateSold}</td>
                      <td className="text-right font-mono">
                        <BlurredValue>{formatCurrency(entry.proceeds)}</BlurredValue>
                      </td>
                      <td className="text-right font-mono">
                        <BlurredValue>{formatCurrency(entry.costBasis)}</BlurredValue>
                      </td>
                      <td
                        className={`text-right font-mono font-semibold ${
                          entry.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        <BlurredValue>{formatCurrency(entry.gainLoss)}</BlurredValue>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={3}>Part II Totals</td>
                    <td className="text-right font-mono">
                      <BlurredValue>{formatCurrency(summary.longTerm.totalProceeds)}</BlurredValue>
                    </td>
                    <td className="text-right font-mono">
                      <BlurredValue>{formatCurrency(summary.longTerm.totalCostBasis)}</BlurredValue>
                    </td>
                    <td
                      className={`text-right font-mono ${
                        summary.longTerm.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      <BlurredValue>{formatCurrency(summary.longTerm.totalGainLoss)}</BlurredValue>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No long-term transactions.</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 text-sm text-gray-600">
          <p className="mb-2">
            <strong>Method:</strong> FIFO (First In, First Out)
          </p>
          <p className="mb-2">
            <strong>Generated:</strong> {new Date().toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500">
            This document is for informational purposes only and does not constitute tax advice.
            Consult a qualified tax professional for guidance specific to your situation.
          </p>
        </div>
      </div>
    </div>
  );
}
