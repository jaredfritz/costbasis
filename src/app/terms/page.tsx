'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Scale className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Terms & Conditions
              </h1>
              <p className="text-gray-600 mt-1">
                CostBasis Service Agreement
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Nature of Service
            </h2>
            <p className="text-gray-700 leading-relaxed">
              CostBasis (the "Service") is a software tool designed to provide
              estimates of cryptocurrency capital gains and losses based on user-provided transaction
              data. We use the FIFO (First In, First Out) accounting method.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Not Tax Advice
            </h2>
            <p className="text-gray-700 leading-relaxed">
              The Service does not provide tax, legal, or financial advice. The calculations generated
              are for informational purposes only. We are not an accounting firm or a tax preparer. You
              should consult with a qualified tax professional before filing your return.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. User Responsibility
            </h2>
            <p className="text-gray-700 leading-relaxed">
              You are solely responsible for the accuracy and completeness of the data you upload. The
              quality of the calculations depends entirely on the "All-Time" transaction history provided.
              You are responsible for the final accuracy of your IRS Form 8949 and your overall tax return.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Privacy & Data
            </h2>
            <p className="text-gray-700 leading-relaxed">
              All processing occurs client-side in your web browser. We do not store, view, or transmit
              your transaction data to our servers. While we prioritize security, we recommend using the
              Service on a private, secure network.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Limitation of Liability
            </h2>
            <p className="text-gray-700 leading-relaxed">
              The Service is provided "as is" without any warranties. To the maximum extent permitted by
              law, we shall not be liable for any errors, omissions, tax penalties, interest, or audits
              arising from your use of the calculations.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Refunds
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Because we offer a "try-before-you-buy" model where you can see a preview of results before
              paying, all $9.99 sales are final.
            </p>
          </section>

          {/* Footer note */}
          <div className="pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Last updated: February 2026
            </p>
            <p className="text-sm text-gray-500 mt-2">
              By using this Service, you acknowledge that you have read, understood, and agree to be
              bound by these Terms & Conditions.
            </p>
          </div>
        </div>

        {/* Back button at bottom */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
