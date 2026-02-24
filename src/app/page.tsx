'use client';

import React, { useState } from 'react';
import { Shield, Lock, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import DiagnosticFlow from '@/components/DiagnosticFlow';
import DiagnosticResult from '@/components/DiagnosticResult';
import FAQ from '@/components/FAQ';
import ComparisonTable from '@/components/ComparisonTable';

export default function LandingPage() {
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticAnswers, setDiagnosticAnswers] = useState<Record<string, string> | null>(null);

  const handleDiagnosticComplete = (answers: Record<string, string>) => {
    setDiagnosticAnswers(answers);
  };

  if (diagnosticAnswers) {
    return (
      <main className="min-h-screen bg-gray-50 py-12 px-4">
        <DiagnosticResult answers={diagnosticAnswers} />
      </main>
    );
  }

  if (showDiagnostic) {
    return (
      <main className="min-h-screen bg-white py-12 px-4">
        <DiagnosticFlow onComplete={handleDiagnosticComplete} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img
              src="/costbasis-logo.png"
              alt="costBasis"
              className="h-8"
            />
          </Link>
          <Link
            href="/app"
            className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to App
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-32 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Headline */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 text-center mb-6 leading-tight">
            Stop Overpaying the IRS for Your Crypto Gains.
          </h1>

          {/* Sub-headline */}
          <p className="text-xl md:text-2xl text-gray-600 text-center mb-12 max-w-4xl mx-auto leading-relaxed">
            Most popular exchanges fail to report your cost basis to the IRS, leaving you to pay
            taxes on the entire sale price. Our privacy-first tool calculates your true gains in
            minutes, potentially saving you <span className="font-bold text-green-700">thousands of dollars</span> for
            a flat <span className="font-bold text-green-700">$9.99</span>.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <button
              onClick={() => setShowDiagnostic(true)}
              className="px-8 py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition-all shadow-lg hover:scale-105 flex items-center gap-2"
            >
              Calculate My Savings
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/app"
              className="px-8 py-4 bg-white text-gray-900 font-semibold text-lg rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all hover:shadow-md"
            >
              Upload CSV & Try for Free
            </Link>
          </div>

          {/* Trust Strip */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-green-600" />
              <span>100% Client-Side</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span>No Account Required</span>
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Data Never Leaves Your Device</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Upload Your CSV
              </h3>
              <p className="text-gray-600">
                Download your transaction history from Coinbase or Crypto.com and upload it to our secure,
                client-side calculator.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Preview Your Results
              </h3>
              <p className="text-gray-600">
                See your calculated gains and Form 8949 entries (blurred) before paying anything.
                No surprises.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Unlock & File
              </h3>
              <p className="text-gray-600">
                Pay $9.99 to unlock your complete Form 8949 and step-by-step filing guides for your tax software.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <ComparisonTable />

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-600 to-green-700">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Stop Overpaying?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of crypto investors who've saved money with accurate cost basis reporting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowDiagnostic(true)}
              className="px-8 py-4 bg-white text-green-700 font-bold text-lg rounded-xl hover:bg-green-50 transition-all shadow-lg hover:scale-105"
            >
              Calculate My Savings
            </button>
            <Link
              href="/app"
              className="px-8 py-4 bg-green-800 text-white font-semibold text-lg rounded-xl hover:bg-green-900 transition-all"
            >
              Upload CSV & Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQ />
    </main>
  );
}
