'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function ComprehensiveDisclaimer() {
  return (
    <section className="py-16 px-4 bg-gray-50 border-t border-gray-200">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-start gap-4 mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Important Disclaimer
              </h2>
              <p className="text-gray-600">
                Please read this carefully before using our calculator.
              </p>
            </div>
          </div>

          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Not Tax Advice</h3>
              <p>
                This calculator provides <strong>informational estimates only</strong> and does not
                constitute tax, legal, or financial advice. The calculations are based on the
                information you provide and may not account for all tax implications of your specific
                situation.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Your Responsibility</h3>
              <p>
                You are <strong>solely responsible</strong> for the accuracy of your tax return.
                We strongly recommend consulting with a qualified tax professional (CPA, Enrolled Agent,
                or tax attorney) before filing, especially if you have:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Complex transactions (DeFi, yield farming, liquidity pools)</li>
                <li>High transaction volumes (100+ transactions)</li>
                <li>Staking, lending, or borrowing activities</li>
                <li>NFT transactions</li>
                <li>Mining or validator rewards</li>
                <li>Cross-chain transfers or wrapped tokens</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Limitations</h3>
              <p className="mb-2">This tool has the following limitations:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Uses <strong>FIFO (First In, First Out)</strong> method only</li>
                <li>May not correctly handle all transaction types (e.g., forks, airdrops, complex DeFi)</li>
                <li>Cost basis calculations depend on complete and accurate transaction history</li>
                <li>Cryptocurrency regulations vary by jurisdiction and change frequently</li>
                <li>Does not account for wash sale rules, though these may apply to crypto in the future</li>
                <li>Does not calculate state taxes or alternative minimum tax (AMT)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">No Warranty</h3>
              <p>
                This tool is provided <strong>"as is"</strong> without warranty of any kind, either
                express or implied. We make no guarantees about the accuracy, reliability, or
                completeness of the calculations. We are <strong>not responsible</strong> for any
                errors, omissions, or any losses or damages arising from use of this calculator,
                including but not limited to tax penalties, interest, or audit costs.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Data Privacy</h3>
              <p>
                Your transaction data is processed <strong>locally in your browser</strong> and is
                not stored on our servers. However, you should still exercise caution when uploading
                sensitive financial information to any website. We recommend:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Using this tool on a secure, private network (not public Wi-Fi)</li>
                <li>Clearing your browser cache after use if using a shared computer</li>
                <li>Verifying the URL is correct before uploading files</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">IRS Reporting Requirements</h3>
              <p>
                The IRS requires you to report all cryptocurrency transactions, even if your exchange
                did not send you a 1099 form. Failure to report cryptocurrency transactions can result
                in penalties and interest. This tool helps you calculate your cost basis, but you are
                responsible for ensuring all transactions are properly reported.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-900 mb-2">Changes and Updates</h3>
              <p>
                Tax laws change frequently. The calculations provided by this tool reflect current
                understanding of tax law as of the date of this software version. Future changes to
                tax law may affect the accuracy of past calculations. We recommend rechecking your
                calculations if you file an amended return in the future.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <p className="text-sm text-gray-600">
                <strong>By using this calculator, you acknowledge that you have read, understood,
                and agree to this disclaimer.</strong> If you do not agree with these terms, do not
                use this tool. Consult with a qualified tax professional for personalized advice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
