'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

export default function ComparisonTable() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
          Why Choose Us?
        </h2>
        <p className="text-center text-gray-600 mb-12 text-lg">
          Simple, private, and designed for crypto investors
        </p>

        <div className="overflow-hidden rounded-2xl border-2 border-gray-200 shadow-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Feature
                </th>
                <th className="px-6 py-4 text-center text-sm font-bold text-green-700 bg-green-50">
                  This Tool
                </th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                  Legacy Tax Software
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-white hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-900 font-medium">
                  Price
                </td>
                <td className="px-6 py-4 text-center bg-green-50">
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-700">$9.99 (Flat Fee)</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-gray-600">
                  $49 – $249 (Annual Sub)
                </td>
              </tr>

              <tr className="bg-white hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-900 font-medium">
                  Privacy
                </td>
                <td className="px-6 py-4 text-center bg-green-50">
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-700">100% Client-Side</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-gray-600">
                  Your data is in their cloud
                </td>
              </tr>

              <tr className="bg-white hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-900 font-medium">
                  Setup Time
                </td>
                <td className="px-6 py-4 text-center bg-green-50">
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="font-bold text-green-700">{'< 5 Minutes'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-gray-600">
                  30+ Minutes
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
