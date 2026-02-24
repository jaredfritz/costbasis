'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: { value: string; label: string }[];
  insight: (value: string) => string;
}

const questions: Question[] = [
  {
    id: 'exchange',
    question: 'Where did you trade most of your crypto this year?',
    options: [
      { value: 'coinbase', label: 'Coinbase' },
      { value: 'cryptocom', label: 'Crypto.com' },
      { value: 'binance', label: 'Binance' },
      { value: 'kraken', label: 'Kraken' },
      { value: 'other', label: 'Other' },
    ],
    insight: (value) => {
      switch (value) {
        case 'coinbase':
          return "Coinbase's 1099-DA often leaves cost basis 'unknown,' which can trigger an overpayment notice.";
        case 'cryptocom':
          return "Crypto.com specifically opted out of reporting cost basis this year—we'll help you fill that gap.";
        case 'binance':
          return 'Binance exports are notoriously fragmented; our parser unifies your trades into one clean report.';
        case 'kraken':
          return 'Kraken is great for security, but their tax exports can be a headache to reconcile manually.';
        case 'other':
          return "No problem. Our universal mapper handles almost any exchange CSV format you throw at it. If we can't, you won't owe us anything. Guaranteed.";
        default:
          return '';
      }
    },
  },
  {
    id: 'tax-docs',
    question: 'Did you receive (or are you expecting) a 1099-DA from your exchange?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'unsure', label: 'Not Sure' },
    ],
    insight: (value) => {
      if (value === 'yes') {
        return "That's what they sent the IRS. Now you need your own accurate data to ensure you don't overpay.";
      }
      return "Most should be arriving soon (if they haven't already). Regardless, you need your own accurate data to ensure you don't overpay.";
    },
  },
  {
    id: 'volume',
    question: 'Roughly how much crypto did you sell or trade in total in 2025?',
    options: [
      { value: 'under1k', label: 'Under $1k' },
      { value: '1k-10k', label: '$1k – $10k' },
      { value: '10k-50k', label: '$10k – $50k' },
      { value: '50k+', label: '$50k+' },
    ],
    insight: (value) => {
      switch (value) {
        case 'under1k':
          return "Every dollar counts. Don't let the IRS take a chunk of your principal investment.";
        case '1k-10k':
          return 'At this volume, an accurate cost basis can save you hundreds if not thousands in taxes.';
        case '10k-50k':
          return 'At this volume, an accurate cost basis can save you thousands in taxes.';
        case '50k+':
          return 'Significant savings alert. Missing cost basis at this level is a major financial leak.';
        default:
          return '';
      }
    },
  },
  {
    id: 'confidence',
    question: 'How confident are you that your exchange reported your "Cost Basis" (what you originally paid) to the IRS?',
    options: [
      { value: 'confident', label: 'Very Confident' },
      { value: 'unsure', label: 'Unsure' },
      { value: 'missing', label: "I know it's missing" },
    ],
    insight: (value) => {
      if (value === 'confident') {
        return "Smart. Our tool provides a perfect final 'audit-check' before you hit submit.";
      }
      return "This is the exact 'trap' our tool was built to fix. We've got you covered.";
    },
  },
  {
    id: 'goal',
    question: 'What is your primary goal today?',
    options: [
      { value: 'tracking', label: 'I want to track my portfolio year-round' },
      { value: 'onetime', label: 'I just want a one-time tax report' },
    ],
    insight: (value) => {
      if (value === 'tracking') {
        return "We'll get your taxes done first so you can get back to your long-term strategy.";
      }
      return "Perfect. That's our specialty: fast, flat-fee, and finished.";
    },
  },
];

interface DiagnosticFlowProps {
  onComplete: (answers: Record<string, string>) => void;
}

export default function DiagnosticFlow({ onComplete }: DiagnosticFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showInsight, setShowInsight] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleOptionClick = (value: string) => {
    setSelectedOption(value);
    setShowInsight(true);

    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Auto-advance after showing insight
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
        setShowInsight(false);
        setSelectedOption(null);
      } else {
        onComplete(newAnswers);
      }
    },2500);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2 text-center">
          Question {currentStep + 1} of {questions.length}
        </p>
      </div>

      {/* Question */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          {currentQuestion.question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-4">
        {currentQuestion.options.map((option) => {
          const isSelected = selectedOption === option.value;
          const wasAnswered = answers[currentQuestion.id] === option.value;

          return (
            <button
              key={option.value}
              onClick={() => !showInsight && handleOptionClick(option.value)}
              disabled={showInsight}
              className={`w-full p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                isSelected
                  ? 'border-green-600 bg-green-50 scale-[1.02]'
                  : wasAnswered
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              } ${showInsight && !isSelected ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">
                  {option.label}
                </span>
                {isSelected && (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Insight */}
      {showInsight && selectedOption && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl animate-fade-in">
          <div className="flex items-start gap-3">
            <ArrowRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-blue-900 font-medium">
              {currentQuestion.insight(selectedOption)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
