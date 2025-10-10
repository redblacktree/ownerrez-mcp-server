#!/usr/bin/env node

/**
 * Simple helper script to generate the OAuth authorization URL
 * Usage: node get-oauth-url.mjs YOUR_CLIENT_ID
 */

const clientId = process.argv[2] || process.env.OWNERREZ_CLIENT_ID;
const redirectUri = process.argv[3] || process.env.OWNERREZ_REDIRECT_URI || 'http://localhost:3000/oauth/callback';

if (!clientId) {
  console.error('❌ Error: Client ID is required');
  console.error('');
  console.error('Usage:');
  console.error('  node get-oauth-url.mjs YOUR_CLIENT_ID [REDIRECT_URI]');
  console.error('');
  console.error('Or set environment variables:');
  console.error('  export OWNERREZ_CLIENT_ID=c_your_client_id');
  console.error('  export OWNERREZ_REDIRECT_URI=http://localhost:3000/oauth/callback');
  console.error('  node get-oauth-url.mjs');
  process.exit(1);
}

const params = new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  redirect_uri: redirectUri,
});

const authUrl = `https://app.ownerrez.com/oauth/authorize?${params.toString()}`;

console.log('');
console.log('🔐 OwnerRez OAuth Authorization URL');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('Client ID:', clientId);
console.log('Redirect URI:', redirectUri);
console.log('');
console.log('Authorization URL:');
console.log(authUrl);
console.log('');
console.log('Next steps:');
console.log('  1. Make sure the HTTP server is running: npm run dev:http');
console.log('  2. Open the URL above in your browser');
console.log('  3. Log into OwnerRez and authorize the app');
console.log('  4. Copy the access token from the callback page');
console.log('');

