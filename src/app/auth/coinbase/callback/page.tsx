'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type CallbackStatus = 'loading' | 'success' | 'error';

function CallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<CallbackStatus>('loading');
  const [message, setMessage] = useState('Connecting to Coinbase...');
  const [transactionCount, setTransactionCount] = useState(0);

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle OAuth errors
      if (error) {
        setStatus('error');
        setMessage(errorDescription || `Coinbase authorization failed: ${error}`);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Missing authorization code or state parameter');
        return;
      }

      // Verify state matches (CSRF protection)
      const storedState = sessionStorage.getItem('coinbase_oauth_state');
      if (state !== storedState) {
        setStatus('error');
        setMessage('Invalid state parameter. Please try connecting again.');
        return;
      }

      try {
        setMessage('Exchanging authorization code...');

        // Exchange code for tokens via our callback API
        const tokenResponse = await fetch('/api/auth/coinbase/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
          throw new Error(tokenData.error || 'Failed to exchange authorization code');
        }

        setMessage('Fetching your transactions...');

        // Fetch transactions using the access token
        const txResponse = await fetch('/api/coinbase/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: tokenData.access_token }),
        });

        const txData = await txResponse.json();

        if (!txResponse.ok) {
          throw new Error(txData.error || 'Failed to fetch transactions');
        }

        setTransactionCount(txData.transactions.length);
        setStatus('success');
        setMessage(`Successfully imported ${txData.transactions.length} transactions!`);

        // Send transactions to parent window
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'COINBASE_TRANSACTIONS',
              transactions: txData.transactions,
              rawTransactionCount: txData.rawTransactionCount,
              accountCount: txData.accountCount,
            },
            window.location.origin
          );

          // Auto-close after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
        }

        // Clear stored state
        sessionStorage.removeItem('coinbase_oauth_state');

      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    }

    handleCallback();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Connecting to Coinbase
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Connection Successful!
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              This window will close automatically...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Connection Failed
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Close Window
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
        <h1 className="text-xl font-semibold text-gray-800 mb-2">
          Loading...
        </h1>
      </div>
    </div>
  );
}

export default function CoinbaseCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CallbackContent />
    </Suspense>
  );
}
