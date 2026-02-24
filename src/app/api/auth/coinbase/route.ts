import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/coinbase-api';

export async function GET() {
  try {
    // Generate a random state parameter for CSRF protection
    const state = Math.random().toString(36).substring(2, 15);

    // Get the authorization URL
    const authUrl = getAuthorizationUrl(state);

    // Return the URL for the client to redirect to
    return NextResponse.json({ url: authUrl, state });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate authorization URL. Please check Coinbase OAuth configuration.' },
      { status: 500 }
    );
  }
}
