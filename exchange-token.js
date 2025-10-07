const https = require('https');

const clientId = 'c_l9moiiilq5k1k0rv5u31maky734sz617';
const clientSecret = 's_t5bkxbq5b95xvir8woeso8uk8dt7cmb2';
const code = 'tc_y1yzes4naxw8vp512857ketjxmllbws5';
const redirectUri = 'http://localhost:3000/oauth/callback';

const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
const postData = new URLSearchParams({
  grant_type: 'authorization_code',
  code: code,
  redirect_uri: redirectUri,
}).toString();

const options = {
  hostname: 'api.ownerrez.com',
  path: '/oauth/access_token',
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'OwnerRez-MCP-Server/1.0'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n=== Token Exchange Response ===\n');
    if (res.statusCode === 200) {
      const response = JSON.parse(data);
      console.log('✅ Success! Access token received:\n');
      console.log(JSON.stringify(response, null, 2));
      console.log('\nAccess Token:', response.access_token);
      console.log('User ID:', response.user_id);
    } else {
      console.log('❌ Error:', res.statusCode);
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(postData);
req.end();
