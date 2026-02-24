'use client';

import React, { useState } from 'react';
import { TaxSummary } from '@/lib/types';
import { ChevronDown, ChevronUp, CheckCircle, ExternalLink, Lock } from 'lucide-react';

interface TaxSoftwareGuideProps {
  summary: TaxSummary;
  isUnlocked?: boolean;
  onUnlock?: () => void;
}

type SoftwareType = 'freetaxusa' | 'turbotax' | 'hrblock';

export default function TaxSoftwareGuide({ summary, isUnlocked = false, onUnlock }: TaxSoftwareGuideProps) {
  const [selectedSoftware, setSelectedSoftware] = useState<SoftwareType>('freetaxusa');
  const [expandedStep, setExpandedStep] = useState<number | null>(0);

  // If proceeds are $0, no tax calculations are needed - auto-unlock
  const noTaxableEvents = summary.totalProceeds === 0;
  const effectivelyUnlocked = isUnlocked || noTaxableEvents;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Blurred value component for locked state
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

  const guides: Record<SoftwareType, { name: string; steps: { title: string; content: React.ReactNode }[] }> = {
    freetaxusa: {
      name: 'FreeTaxUSA',
      steps: [
        {
          title: 'Navigate to Investment Income',
          content: (
            <div className="space-y-2">
              <p>From the Federal Tax menu, go to:</p>
              <p className="font-mono bg-gray-100 p-2 rounded">
                Income → Investments → Stocks, Mutual Funds, Cryptocurrency, etc.
              </p>
            </div>
          ),
        },
        {
          title: 'Add Cryptocurrency Sales',
          content: (
            <div className="space-y-2">
              <p>Click "Add Investment Sale" and select "Cryptocurrency" as the type.</p>
              <p>When asked about 1099-DA, select "Yes, I received a 1099-DA".</p>
            </div>
          ),
        },
        {
          title: 'Enter Short-Term Transactions (Box H)',
          content: (
            <div className="space-y-3">
              <p>For your short-term sales, select:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Sales Section:</strong> H - Short-term basis not reported to IRS (noncovered)</li>
              </ul>
              <div className="bg-blue-50 p-3 rounded-lg mt-3">
                <p className="font-semibold text-blue-800">Enter these values:</p>
                <table className="w-full mt-2 text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1">Sales Proceeds:</td>
                      <td className="font-mono font-semibold"><BlurredValue>{formatCurrency(summary.shortTerm.totalProceeds)}</BlurredValue></td>
                    </tr>
                    <tr>
                      <td className="py-1">Cost Basis:</td>
                      <td className="font-mono font-semibold"><BlurredValue>{formatCurrency(summary.shortTerm.totalCostBasis)}</BlurredValue></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ),
        },
        {
          title: 'Indicate Adjustments',
          content: (
            <div className="space-y-2">
              <p>When asked "Do you have adjustments to this investment sale?", select <strong>Yes</strong>.</p>
              <p>Check the following boxes:</p>
              <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                <li>☑ The basis shown in Box 1g is incorrect</li>
                <li>☑ Box 6 short-term or long-term is incorrect</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">
                This indicates you're providing the correct cost basis since Crypto.com didn't report it.
              </p>
            </div>
          ),
        },
        {
          title: 'Enter Long-Term Transactions (Box K)',
          content: (
            <div className="space-y-3">
              <p>Add another sale for your long-term transactions. Select:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Sales Section:</strong> K - Long-term basis not reported to IRS (noncovered)</li>
              </ul>
              <div className="bg-green-50 p-3 rounded-lg mt-3">
                <p className="font-semibold text-green-800">Enter these values:</p>
                <table className="w-full mt-2 text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1">Sales Proceeds:</td>
                      <td className="font-mono font-semibold"><BlurredValue>{formatCurrency(summary.longTerm.totalProceeds)}</BlurredValue></td>
                    </tr>
                    <tr>
                      <td className="py-1">Cost Basis:</td>
                      <td className="font-mono font-semibold"><BlurredValue>{formatCurrency(summary.longTerm.totalCostBasis)}</BlurredValue></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-600">
                Repeat the adjustment steps (checking the same boxes) for long-term transactions.
              </p>
            </div>
          ),
        },
        {
          title: 'Attach Summary Statement',
          content: (
            <div className="space-y-2">
              <p>When prompted to attach a summary statement:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Download the Form 8949 from this page (click "Download TXT" above)</li>
                <li>Upload it as your summary statement</li>
                <li>Since both sales came from the same 1099-DA, you only need to attach once</li>
              </ol>
            </div>
          ),
        },
      ],
    },
    turbotax: {
      name: 'TurboTax',
      steps: [
        {
          title: 'Navigate to Cryptocurrency Section',
          content: (
            <div className="space-y-2">
              <p>From the Federal menu, go to:</p>
              <p className="font-mono bg-gray-100 p-2 rounded">
                Wages & Income → Investments and Savings → Cryptocurrency
              </p>
            </div>
          ),
        },
        {
          title: 'Select Your Exchange',
          content: (
            <div className="space-y-2">
              <p>TurboTax will ask how you want to enter your crypto transactions.</p>
              <p>Select "Enter transactions manually" or upload a CSV if prompted.</p>
            </div>
          ),
        },
        {
          title: 'Enter Short-Term Sales',
          content: (
            <div className="space-y-3">
              <p>Add your short-term cryptocurrency sales:</p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1">Description:</td>
                      <td className="font-mono">Cryptocurrency (Short-term)</td>
                    </tr>
                    <tr>
                      <td className="py-1">Date Acquired:</td>
                      <td className="font-mono">Various</td>
                    </tr>
                    <tr>
                      <td className="py-1">Date Sold:</td>
                      <td className="font-mono">Various</td>
                    </tr>
                    <tr>
                      <td className="py-1">Sales Proceeds:</td>
                      <td className="font-mono font-semibold"><BlurredValue>{formatCurrency(summary.shortTerm.totalProceeds)}</BlurredValue></td>
                    </tr>
                    <tr>
                      <td className="py-1">Cost Basis:</td>
                      <td className="font-mono font-semibold"><BlurredValue>{formatCurrency(summary.shortTerm.totalCostBasis)}</BlurredValue></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-600">
                Select "I'll enter additional information on my own" when asked about 1099-B/1099-DA details.
              </p>
            </div>
          ),
        },
        {
          title: 'Enter Long-Term Sales',
          content: (
            <div className="space-y-3">
              <p>Add your long-term cryptocurrency sales:</p>
              <div className="bg-green-50 p-3 rounded-lg">
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="py-1">Description:</td>
                      <td className="font-mono">Cryptocurrency (Long-term)</td>
                    </tr>
                    <tr>
                      <td className="py-1">Date Acquired:</td>
                      <td className="font-mono">Various</td>
                    </tr>
                    <tr>
                      <td className="py-1">Date Sold:</td>
                      <td className="font-mono">Various</td>
                    </tr>
                    <tr>
                      <td className="py-1">Sales Proceeds:</td>
                      <td className="font-mono font-semibold"><BlurredValue>{formatCurrency(summary.longTerm.totalProceeds)}</BlurredValue></td>
                    </tr>
                    <tr>
                      <td className="py-1">Cost Basis:</td>
                      <td className="font-mono font-semibold"><BlurredValue>{formatCurrency(summary.longTerm.totalCostBasis)}</BlurredValue></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ),
        },
        {
          title: 'Review and Attach Documents',
          content: (
            <div className="space-y-2">
              <p>TurboTax may ask you to review your entries or attach supporting documents.</p>
              <p>Download the Form 8949 from this page and keep it with your tax records.</p>
            </div>
          ),
        },
      ],
    },
    hrblock: {
      name: 'H&R Block',
      steps: [
        {
          title: 'Navigate to Investment Income',
          content: (
            <div className="space-y-2">
              <p>From the Federal menu, go to:</p>
              <p className="font-mono bg-gray-100 p-2 rounded">
                Income → Investments → Stocks, Cryptocurrency & Other Investments
              </p>
            </div>
          ),
        },
        {
          title: 'Select Cryptocurrency',
          content: (
            <div className="space-y-2">
              <p>Select "Cryptocurrency" when asked about the type of investment.</p>
              <p>Choose to enter transactions manually.</p>
            </div>
          ),
        },
        {
          title: 'Enter Your Sales',
          content: (
            <div className="space-y-3">
              <p>Enter both short-term and long-term sales separately:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-semibold text-blue-800 mb-2">Short-Term</p>
                  <p className="text-sm">Proceeds: <BlurredValue>{formatCurrency(summary.shortTerm.totalProceeds)}</BlurredValue></p>
                  <p className="text-sm">Cost Basis: <BlurredValue>{formatCurrency(summary.shortTerm.totalCostBasis)}</BlurredValue></p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="font-semibold text-green-800 mb-2">Long-Term</p>
                  <p className="text-sm">Proceeds: <BlurredValue>{formatCurrency(summary.longTerm.totalProceeds)}</BlurredValue></p>
                  <p className="text-sm">Cost Basis: <BlurredValue>{formatCurrency(summary.longTerm.totalCostBasis)}</BlurredValue></p>
                </div>
              </div>
            </div>
          ),
        },
        {
          title: 'Indicate Basis Not Reported',
          content: (
            <div className="space-y-2">
              <p>When asked about 1099 reporting, indicate that:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>You received a 1099-DA</li>
                <li>Cost basis was NOT reported to the IRS</li>
              </ul>
            </div>
          ),
        },
      ],
    },
  };

  const currentGuide = guides[selectedSoftware];

  return (
    <div className="space-y-6">
      {/* Unlock CTA */}
      {!isUnlocked && !noTaxableEvents && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Unlock Tax Software Guides</h3>
                <p className="text-blue-100 text-sm">
                  Get the exact values to enter in your tax software
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

      {/* Software selector */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Select Your Tax Software
        </h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(guides) as SoftwareType[]).map((key) => (
            <button
              key={key}
              onClick={() => {
                setSelectedSoftware(key);
                setExpandedStep(0);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSoftware === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {guides[key].name}
            </button>
          ))}
        </div>
      </div>

      {/* Quick reference */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">Quick Reference Values</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Short-Term Proceeds</p>
            <p className="font-mono font-semibold">
              <BlurredValue>{formatCurrency(summary.shortTerm.totalProceeds)}</BlurredValue>
            </p>
          </div>
          <div>
            <p className="text-gray-500">Short-Term Basis</p>
            <p className="font-mono font-semibold">
              <BlurredValue>{formatCurrency(summary.shortTerm.totalCostBasis)}</BlurredValue>
            </p>
          </div>
          <div>
            <p className="text-gray-500">Long-Term Proceeds</p>
            <p className="font-mono font-semibold">
              <BlurredValue>{formatCurrency(summary.longTerm.totalProceeds)}</BlurredValue>
            </p>
          </div>
          <div>
            <p className="text-gray-500">Long-Term Basis</p>
            <p className="font-mono font-semibold">
              <BlurredValue>{formatCurrency(summary.longTerm.totalCostBasis)}</BlurredValue>
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">
          Step-by-Step Guide for {currentGuide.name}
        </h3>

        {currentGuide.steps.map((step, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setExpandedStep(expandedStep === index ? null : index)}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    expandedStep !== null && expandedStep > index
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  {expandedStep !== null && expandedStep > index ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="font-medium text-gray-800">{step.title}</span>
              </div>
              {expandedStep === index ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedStep === index && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                {step.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* External link */}
      <div className="text-center pt-4">
        <a
          href={
            selectedSoftware === 'freetaxusa'
              ? 'https://www.freetaxusa.com'
              : selectedSoftware === 'turbotax'
              ? 'https://turbotax.intuit.com'
              : 'https://www.hrblock.com'
          }
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          Open {currentGuide.name}
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
