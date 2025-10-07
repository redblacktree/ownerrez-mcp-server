const clientId = 'c_l9moiiilq5k1k0rv5u31maky734sz617';
const redirectUri = 'http://localhost:3000/oauth/callback';
const state = Math.random().toString(36).substring(7);

const params = new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  redirect_uri: redirectUri,
  state: state
});

const url = `https://app.ownerrez.com/oauth/authorize?${params.toString()}`;

console.log('\n=== OwnerRez OAuth Authorization ===\n');
console.log('1. Visit this URL in your browser:\n');
console.log(url);
console.log('\n2. Login to OwnerRez and authorize the application');
console.log('3. You will be redirected to: http://localhost:3000/oauth/callback?code=tc_...');
console.log('4. Copy the "code" parameter from the URL (starts with tc_)');
console.log('\nState (for verification):', state);
console.log('\n');
