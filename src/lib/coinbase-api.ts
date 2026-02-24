// Coinbase OAuth and API utilities

const COINBASE_AUTH_URL = 'https://www.coinbase.com/oauth/authorize';
const COINBASE_TOKEN_URL = 'https://api.coinbase.com/oauth/token';
const COINBASE_API_URL = 'https://api.coinbase.com/v2';

// OAuth scopes needed for transaction history
const SCOPES = [
  'wallet:accounts:read',
  'wallet:transactions:read',
  'wallet:buys:read',
  'wallet:sells:read',
  'wallet:trades:read',
].join(' ');

export interface CoinbaseTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface CoinbaseAccount {
  id: string;
  name: string;
  primary: boolean;
  type: string;
  currency: {
    code: string;
    name: string;
  };
  balance: {
    amount: string;
    currency: string;
  };
  created_at: string;
  updated_at: string;
}

export interface CoinbaseTransaction {
  id: string;
  type: string;
  status: string;
  amount: {
    amount: string;
    currency: string;
  };
  native_amount: {
    amount: string;
    currency: string;
  };
  description: string | null;
  created_at: string;
  updated_at: string;
  resource: string;
  instant_exchange: boolean;
  details: {
    title: string;
    subtitle: string;
    header?: string;
    health?: string;
  };
  buy?: {
    id: string;
    resource: string;
  };
  sell?: {
    id: string;
    resource: string;
  };
  trade?: {
    id: string;
    resource: string;
  };
}

export interface CoinbasePaginatedResponse<T> {
  pagination: {
    ending_before: string | null;
    starting_after: string | null;
    previous_ending_before: string | null;
    next_starting_after: string | null;
    limit: number;
    order: string;
    previous_uri: string | null;
    next_uri: string | null;
  };
  data: T[];
}

/**
 * Generate the Coinbase OAuth authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  const clientId = process.env.COINBASE_CLIENT_ID;
  const redirectUri = process.env.COINBASE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    throw new Error('Missing Coinbase OAuth configuration');
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES,
    state: state,
    account: 'all', // Request access to all accounts
  });

  return `${COINBASE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<CoinbaseTokens> {
  const clientId = process.env.COINBASE_CLIENT_ID;
  const clientSecret = process.env.COINBASE_CLIENT_SECRET;
  const redirectUri = process.env.COINBASE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Coinbase OAuth configuration');
  }

  const response = await fetch(COINBASE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<CoinbaseTokens> {
  const clientId = process.env.COINBASE_CLIENT_ID;
  const clientSecret = process.env.COINBASE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Coinbase OAuth configuration');
  }

  const response = await fetch(COINBASE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json();
}

/**
 * Make an authenticated request to the Coinbase API
 */
async function coinbaseApiRequest<T>(
  endpoint: string,
  accessToken: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(`${COINBASE_API_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'CB-VERSION': '2024-01-01', // API version
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Coinbase API error: ${error}`);
  }

  return response.json();
}

/**
 * Get all user accounts
 */
export async function getAccounts(accessToken: string): Promise<CoinbaseAccount[]> {
  const allAccounts: CoinbaseAccount[] = [];
  let nextUri: string | null = '/accounts';

  while (nextUri) {
    const result: CoinbasePaginatedResponse<CoinbaseAccount> = await coinbaseApiRequest(
      nextUri,
      accessToken,
      { limit: '100' }
    );

    allAccounts.push(...result.data);
    nextUri = result.pagination.next_uri;
  }

  return allAccounts;
}

/**
 * Get transactions for a specific account
 */
export async function getAccountTransactions(
  accessToken: string,
  accountId: string
): Promise<CoinbaseTransaction[]> {
  const allTransactions: CoinbaseTransaction[] = [];
  let nextUri: string | null = `/accounts/${accountId}/transactions`;

  while (nextUri) {
    const result: CoinbasePaginatedResponse<CoinbaseTransaction> = await coinbaseApiRequest(
      nextUri,
      accessToken,
      { limit: '100', expand: 'all' }
    );

    allTransactions.push(...result.data);
    nextUri = result.pagination.next_uri;
  }

  return allTransactions;
}

/**
 * Get all transactions across all accounts
 */
export async function getAllTransactions(accessToken: string): Promise<{
  transactions: CoinbaseTransaction[];
  accounts: CoinbaseAccount[];
}> {
  // First, get all accounts
  const accounts = await getAccounts(accessToken);

  // Then, get transactions for each account
  const allTransactions: CoinbaseTransaction[] = [];

  for (const account of accounts) {
    try {
      const transactions = await getAccountTransactions(accessToken, account.id);
      // Add account info to each transaction for context
      const enrichedTransactions = transactions.map((tx) => ({
        ...tx,
        _accountCurrency: account.currency.code,
        _accountName: account.name,
      }));
      allTransactions.push(...(enrichedTransactions as CoinbaseTransaction[]));
    } catch (error) {
      console.error(`Failed to get transactions for account ${account.id}:`, error);
    }
  }

  return { transactions: allTransactions, accounts };
}
