# OAuth Setup Guide

This guide walks you through setting up OAuth authentication with OwnerRez for the MCP server.

## Step 1: Contact OwnerRez

Before creating an OAuth app, it's recommended to contact OwnerRez:

**Email**: partnerhelp@ownerrez.com  
**Subject**: New OAuth App Integration

Let them know:
- What you're building (MCP server for AI assistant integration)
- Your use case
- Any specific API endpoints you'll be using

## Step 2: Create OAuth App in OwnerRez

1. **Login to OwnerRez**: Go to https://app.ownerrez.com/
2. **Navigate to API Settings**: Click the dropdown arrow in the top-right → "Developer/API Settings"
   - Direct link: https://app.ownerrez.com/settings/api
3. **Create New App**: Click "Create App" or "New OAuth App"

## Step 3: Configure OAuth App

Fill in the required fields:

### Name
```
Claude MCP Integration
```
or any descriptive name that users will recognize during authorization

### Homepage URL
```
https://github.com/your-username/ownerrez-mcp-server
```
or your landing page describing the integration

### OAuth Redirect URL

**For Local Development:**
```
http://localhost:3000/oauth/callback
```

**For Production:**
```
https://your-app-name.fly.dev/oauth/callback
```

**For Testing with ngrok:**
```
https://your-subdomain.ngrok.io/oauth/callback
```

**Important Notes:**
- Must use `https://` for production (except localhost)
- The URL must match exactly during OAuth flow
- You can change this later if needed

### Webhook URL (Optional)

If you want to receive webhooks from OwnerRez:

**URL:**
```
https://your-app-name.fly.dev/webhooks
```

**Username/Password:**
Set credentials for basic authentication (these will be sent with webhook requests)

### Description (Optional)
Add a description of what your app does

### Logo (Optional)
Upload a logo that will be shown during authorization

## Step 4: Save Credentials

After creating the app, you'll receive:

### Client ID
```
c_xxxxxxxxxxxxxxxxxxxxx
```
- Starts with `c_`
- This is public and can be shared

### Client Secret
```
s_xxxxxxxxxxxxxxxxxxxxx
```
- Starts with `s_`
- **CRITICAL**: Save this immediately! You cannot view it again
- Keep this secret and never commit it to version control
- If lost, you'll need to regenerate a new one

## Step 5: Complete OAuth Flow

### Manual Method

1. **Generate Authorization URL**:
```bash
https://app.ownerrez.com/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT_URI
```

Replace:
- `YOUR_CLIENT_ID` with your actual client ID
- `YOUR_REDIRECT_URI` with your redirect URI (URL encoded if needed)

2. **Visit the URL**: Open the URL in a browser
   - You'll be prompted to login to OwnerRez (if not already logged in)
   - Review the permissions requested
   - Click "Authorize" to grant access

3. **Get Authorization Code**: You'll be redirected to:
```
http://localhost:3000/oauth/callback?code=tc_xxxxxxxxxx
```
Copy the `code` parameter value (starts with `tc_`)

4. **Exchange Code for Token**:

**IMPORTANT**: OwnerRez has a quirk - do NOT include `redirect_uri` in the token exchange request, even though the OAuth 2.0 spec and their documentation suggests it. Including it will cause 403 errors.

```bash
curl -u YOUR_CLIENT_ID:YOUR_CLIENT_SECRET \
  -d code=YOUR_AUTHORIZATION_CODE \
  -d grant_type=authorization_code \
  -X POST https://api.ownerrez.com/oauth/access_token
```

5. **Response**:
```json
{
  "access_token": "at_xxxxxxxxxxxxxxxxx",
  "token_type": "bearer",
  "scope": "all",
  "user_id": 123456
}
```

6. **Save Access Token**: Copy the `access_token` value (starts with `at_`)

### Using the MCP Server Tool

1. Configure the MCP server with Client ID and Secret (but no access token yet)
2. Start your MCP client
3. Use the `get_oauth_url` tool to generate the authorization URL
4. Follow steps 2-6 above

## Step 6: Configure Environment

### Local Development

Add the credentials to your `.env` file:

```env
OWNERREZ_CLIENT_ID=c_your_actual_client_id
OWNERREZ_CLIENT_SECRET=s_your_actual_client_secret
OWNERREZ_REDIRECT_URI=http://localhost:3000/oauth/callback
OWNERREZ_ACCESS_TOKEN=at_your_actual_access_token
```

### Production Deployment (Fly.io)

For production deployments via GitHub Actions:

1. **Add GitHub Secrets**:
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add the following repository secrets:
     - `OWNERREZ_CLIENT_ID` = `c_your_actual_client_id`
     - `OWNERREZ_CLIENT_SECRET` = `s_your_actual_client_secret`
     - `FLY_API_TOKEN` = `your_fly_api_token` (if not already set)

2. **Automatic Configuration**:
   - The GitHub Actions workflow automatically sets these as Fly.io secrets during deployment
   - The redirect URI is automatically set to `https://ownerrez-mcp-server.fly.dev/oauth/callback`
   - No manual Fly.io secret configuration needed

3. **Verify Deployment**:
   ```bash
   # Check if secrets are set
   flyctl secrets list -a ownerrez-mcp-server
   ```

**Note**: Access tokens are user-specific and should be obtained by each user through the OAuth flow in production, not hardcoded in deployment.

## Step 7: Test Authentication

Run a test command through your MCP client:

```
"Get my OwnerRez user information"
```

This should call the `get_current_user` tool and return your user details if authentication is successful.

## Token Management

### Token Lifetime
- OwnerRez access tokens are **long-lived**
- They don't expire unless:
  - User revokes access
  - You revoke the token programmatically
  - The OAuth app is deleted

### Revoking Access

**From User Side:**
Users can revoke access in OwnerRez under API Settings

**Programmatically:**
```bash
curl -u YOUR_CLIENT_ID:YOUR_CLIENT_SECRET \
  -X DELETE https://api.ownerrez.com/oauth/access_token/YOUR_ACCESS_TOKEN
```

### Token Security
- Store tokens securely
- Never commit tokens to version control
- Use environment variables or secure secret management
- Rotate Client Secret if compromised

## Webhook Setup (Optional)

If you configured webhook URL:

1. **Subscribe to Events**: Use the `create_webhook_subscription` tool
2. **Available Categories**: Use `get_webhook_categories` to see options
3. **Handle Webhooks**: Implement endpoint to receive POST requests
4. **Verify Requests**: Check basic auth username/password you configured

Example webhook categories:
- `booking_created`
- `booking_updated`
- `guest_created`
- etc.

## Troubleshooting

### "Invalid Client" Error
- Double-check Client ID and Secret
- Ensure no extra spaces or characters
- Verify you're using the correct credentials

### "Redirect URI Mismatch"
- The redirect URI in your OAuth request must exactly match what's configured in OwnerRez
- Check for http vs https
- Check for trailing slashes
- Port numbers must match

### "Invalid Grant" Error
- Authorization code expired (valid for 10 minutes)
- Code already used (can only use once)
- Start the OAuth flow again

### "Access Denied" Error
- User declined authorization
- Try the OAuth flow again

### "403 Forbidden" on Token Exchange
- **Most Common**: Including `redirect_uri` parameter in the POST body (see Step 5 for correct format)
- Missing or invalid User-Agent header
- IP address blocked (try from your local machine instead of cloud VM)
- Contact OwnerRez support if issue persists

### "403 Forbidden" on API Calls
- Missing User-Agent header (handled by the MCP server)
- IP address blocked
- Invalid or revoked access token
- Contact OwnerRez support

### Token Not Working
- Verify the token starts with `at_`
- Check if user revoked access
- Complete OAuth flow again to get a new token

## Premium Features

Some API endpoints require premium features or partnerships:

### Messaging API
**Requirement**: Messaging partnership agreement  
**Contact**: partnerhelp@ownerrez.com with subject "Messaging API Access"

### Listing Endpoints
**Requirement**: WordPress Plugin + Integrated Websites premium feature  
**Contact**: partnerhelp@ownerrez.com with subject "Listing Endpoints Access"

## Additional Resources

- [OwnerRez OAuth Documentation](https://www.ownerrez.com/support/articles/api-oauth-app)
- [OwnerRez API Documentation](https://api.ownerrez.com/help/v2)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)

## Support

- **OAuth Setup Issues**: partnerhelp@ownerrez.com
- **API Questions**: help@ownerrez.com
- **MCP Server Issues**: Open a GitHub issue
