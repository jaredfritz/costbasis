'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: "Why doesn't my exchange just give me my cost basis?",
    answer: "Most exchanges opted out of reporting cost basis for 2025. Their 1099-DA forms only show your \"Gross Proceeds,\" which can trick the IRS into thinking 100% of your sales were profit.",
  },
  {
    question: 'How is this more private than other software?',
    answer: "Zero data leaves your device. Our code runs locally in your browser; we never see your transactions or identity.",
  },
  {
    question: 'What if I trade on an unsupported exchange?',
    answer: "Our Universal Mapper handles almost any CSV. If we can't process it, you don't owe us a cent.",
  },
  {
    question: 'Do I see results before I pay?',
    answer: 'Yes. Preview your gains and short/long-term split for free. Pay $9.99 only to unlock the final filing values.',
  },
  {
    question: 'How do I use this to file?',
    answer: 'Unlock a pre-formatted Form 8949 and a step-by-step "Filing Bridge" for FreeTaxUSA, TurboTax, and H&R Block.',
  },
  {
    question: 'Is this formal tax advice?',
    answer: 'No. This tool provides informational estimates.',
    hasLink: true,
  },
];

export default function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors text-left"
              >
                <span className="font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                {expandedIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {expandedIndex === index && (
                <div className="px-6 pb-6 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700 leading-relaxed">
                    {faq.answer}{' '}
                    {faq.hasLink && (
                      <>
                        See our full{' '}
                        <Link href="/terms" className="text-blue-600 hover:text-blue-800 underline">
                          Terms & Conditions
                        </Link>{' '}
                        for details.
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
