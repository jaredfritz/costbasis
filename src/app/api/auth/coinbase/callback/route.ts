import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/coinbase-api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${appUrl}?coinbase_error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Validate required parameters
  if (!code) {
    return NextResponse.redirect(
      `${appUrl}?coinbase_error=${encodeURIComponent('Missing authorization code')}`
    );
  }

  try {
    // Exchange the code for tokens
    const tokens = await exchangeCodeForTokens(code);

    // Redirect back to the app with the tokens
    // Note: In production, you'd want to store these in a secure session/cookie
    // For this MVP, we're passing them as URL params (the access token is short-lived)
    const redirectUrl = new URL(appUrl);
    redirectUrl.searchParams.set('coinbase_connected', 'true');
    redirectUrl.searchParams.set('coinbase_access_token', tokens.access_token);
    redirectUrl.searchParams.set('coinbase_refresh_token', tokens.refresh_token);
    redirectUrl.searchParams.set('coinbase_expires_in', tokens.expires_in.toString());

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error('Token exchange error:', err);
    return NextResponse.redirect(
      `${appUrl}?coinbase_error=${encodeURIComponent('Failed to connect to Coinbase. Please try again.')}`
    );
  }
}
