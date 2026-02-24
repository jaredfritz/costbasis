'use client';

import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface DiagnosticResultProps {
  answers: Record<string, string>;
}

export default function DiagnosticResult({ answers }: DiagnosticResultProps) {
  // Calculate potential savings based on volume
  const getPotentialSavings = () => {
    const volume = answers.volume;
    switch (volume) {
      case 'under1k':
        return { min: 50, max: 150 };
      case '1k-10k':
        return { min: 150, max: 1500 };
      case '10k-50k':
        return { min: 1500, max: 7500 };
      case '50k+':
        return { min: 7500, max: 15000 };
      default:
        return { min: 150, max: 1500 };
    }
  };

  const savings = getPotentialSavings();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Alert Card */}
      <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-8 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 rounded-full">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              1099-DA Tax Trap Detected
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              The form submitted to the IRS from your exchange likely ignores your original
              purchase price. At a 15% capital gains rate (or higher), you could be overpaying
              by <span className="font-bold text-amber-900">${savings.min.toLocaleString()} – ${savings.max.toLocaleString()}</span> in
              unnecessary taxes.
            </p>
            <p className="mt-4 text-lg text-gray-700">
              Our tool finds your true cost basis in seconds so you keep your full share of the earnings.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Card */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 text-white text-center shadow-xl">
        <h3 className="text-3xl font-bold mb-4">
          See Your Real Gains - Free
        </h3>
        <p className="text-xl text-green-100 mb-6">
          Upload your transaction CSV and preview your calculations before you pay anything.
        </p>
        <Link
          href="/app"
          className="inline-flex items-center gap-3 px-8 py-4 bg-white text-green-700 font-bold text-lg rounded-xl hover:bg-green-50 transition-all shadow-lg hover:scale-105"
        >
          Upload Your CSV & Get Started
          <ArrowRight className="w-6 h-6" />
        </Link>
        <p className="mt-4 text-sm text-green-100">
          100% client-side • No account required • Data never leaves your device
        </p>
      </div>

      {/* Why Us Section */}
      <div className="mt-16 mb-12">
        <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Why Us vs. The "Other" Guys
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Feature
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-green-700 bg-green-50">
                  Our Tool
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Legacy Tax Software
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-white hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">Pricing</td>
                <td className="px-6 py-4 bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">$9.99 (Flat Fee)</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">$49 – $249 (Annual Sub)</td>
              </tr>
              <tr className="bg-white hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">Privacy</td>
                <td className="px-6 py-4 bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">No data leaves your browser</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">Data stored in their cloud</td>
              </tr>
              <tr className="bg-white hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">Experience</td>
                <td className="px-6 py-4 bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">Focused on the "Hobbyist"</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">Overly complex for simple filers</td>
              </tr>
              <tr className="bg-white hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">Trial</td>
                <td className="px-6 py-4 bg-green-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-900">See results before you pay</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">Pay upfront to see anything</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition-colors shadow-lg"
        >
          Get Started Now
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
