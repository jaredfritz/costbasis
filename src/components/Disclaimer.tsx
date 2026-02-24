'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

interface DisclaimerProps {
  onAccept?: () => void;
  showAcceptButton?: boolean;
}

export default function Disclaimer({ onAccept, showAcceptButton = false }: DisclaimerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <span className="font-semibold text-amber-800">Important Disclaimer</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-amber-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-amber-600" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 text-sm text-amber-900">
          <div>
            <h4 className="font-semibold mb-1">Not Tax Advice</h4>
            <p>
              This calculator provides informational estimates only and does not constitute tax,
              legal, or financial advice. The calculations are based on the information you provide
              and may not account for all tax implications of your specific situation.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Your Responsibility</h4>
            <p>
              You are solely responsible for the accuracy of your tax return. We strongly recommend
              consulting with a qualified tax professional (CPA, Enrolled Agent, or tax attorney)
              before filing, especially if you have complex transactions, high transaction volumes,
              or DeFi/staking activities.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Limitations</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>This tool uses FIFO (First In, First Out) method only</li>
              <li>It may not correctly handle all transaction types (e.g., forks, airdrops, complex DeFi)</li>
              <li>Cost basis calculations depend on complete and accurate transaction history</li>
              <li>Cryptocurrency regulations vary by jurisdiction and change frequently</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-1">No Warranty</h4>
            <p>
              This tool is provided "as is" without warranty of any kind. We are not responsible
              for any errors, omissions, or any losses or damages arising from use of this calculator.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-1">Data Privacy</h4>
            <p>
              Your transaction data is processed locally in your browser and is not stored on our
              servers. However, you should still exercise caution when uploading sensitive financial
              information to any website.
            </p>
          </div>

          {showAcceptButton && onAccept && (
            <div className="pt-4 border-t border-amber-200">
              <button
                onClick={onAccept}
                className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
              >
                I Understand and Accept
              </button>
            </div>
          )}
        </div>
      )}

      {!expanded && (
        <p className="px-4 pb-4 text-xs text-amber-700">
          Click to read the full disclaimer. This tool is for informational purposes only and
          does not constitute tax advice.
        </p>
      )}
    </div>
  );
}

export function CompactDisclaimer() {
  return (
    <div className="text-xs text-gray-500 text-center p-4 border-t border-gray-200 mt-8">
      <p>
        <strong>Disclaimer:</strong> This calculator provides informational estimates only and does
        not constitute tax, legal, or financial advice. You are solely responsible for the accuracy
        of your tax return. Consult a qualified tax professional for guidance specific to your situation.
      </p>
      <p className="mt-2">
        Cost basis calculated using FIFO method. Data is processed locally in your browser.
      </p>
    </div>
  );
}
