#!/usr/bin/env node

import { OwnerRezClient } from './build/client.js';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new OwnerRezClient({
  clientId: process.env.OWNERREZ_CLIENT_ID || '',
  clientSecret: process.env.OWNERREZ_CLIENT_SECRET || '',
  redirectUri: process.env.OWNERREZ_REDIRECT_URI || '',
  accessToken: process.env.OWNERREZ_PAT || process.env.OWNERREZ_ACCESS_TOKEN || '',
});

async function testAPI() {
  try {
    console.log('Testing OwnerRez API connection...');

    // Test with getCurrentUser - this should work with PAT
    const user = await client.getCurrentUser();
    console.log('✅ API connection successful!');
    console.log('Current user:', JSON.stringify(user, null, 2));

  } catch (error) {
    console.error('❌ API connection failed:');
    console.error('Error:', error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testAPI();
