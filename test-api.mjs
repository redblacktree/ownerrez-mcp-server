import dotenv from 'dotenv';
import { OwnerRezClient } from './build/client.js';

dotenv.config();

const client = new OwnerRezClient({
  clientId: process.env.OWNERREZ_CLIENT_ID,
  clientSecret: process.env.OWNERREZ_CLIENT_SECRET,
  redirectUri: process.env.OWNERREZ_REDIRECT_URI,
  accessToken: process.env.OWNERREZ_ACCESS_TOKEN,
});

console.log('Testing OwnerRez API connection...\n');

try {
  const user = await client.getCurrentUser();
  console.log('✓ Successfully connected to OwnerRez API!\n');
  console.log('User Info:');
  console.log(JSON.stringify(user, null, 2));
  console.log('\nAPI is working correctly!');
} catch (error) {
  console.error('✗ API connection failed:');
  console.error(error.response?.data || error.message);
  process.exit(1);
}
