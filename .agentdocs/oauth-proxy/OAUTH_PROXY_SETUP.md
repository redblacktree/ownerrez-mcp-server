# OAuth Proxy Setup Guide

## What is the OAuth Proxy?

The OAuth proxy allows multiple users to connect their own OwnerRez accounts to the MCP server without needing to create their own OAuth apps. This architecture:

- ✅ Works with ChatGPT, Claude Desktop, and Cursor
- ✅ Each user has their own OwnerRez connection
- ✅ Simple API key authentication
- ✅ Centralized server deployment
- ✅ Secure token storage

## Prerequisites

- Fly.io CLI installed (`brew install flyctl`)
- Fly.io account
- Existing MCP server deployed to Fly.io

## Step 1: Create Fly.io Postgres Database

```bash
# Create a new Postgres database
flyctl postgres create --name ownerrez-mcp-db --region iad

# Attach the database to your app
flyctl postgres attach ownerrez-mcp-db --app ownerrez-mcp-server
```

This will automatically set the `DATABASE_URL` environment variable in your app.

## Step 2: Set Encryption Key

The OAuth proxy encrypts OwnerRez tokens before storing them in the database:

```bash
# Generate a random encryption key (32 bytes)
openssl rand -base64 32

# Set it as a Fly.io secret
flyctl secrets set ENCRYPTION_KEY="<generated-key>" --app ownerrez-mcp-server
```

## Step 3: Update Redirect URI

Update your OwnerRez OAuth app redirect URI to include the new proxy callback:

```bash
flyctl secrets set \
  OWNERREZ_REDIRECT_URI="https://ownerrez-mcp-server.fly.dev/api/connect/ownerrez/callback" \
  --app ownerrez-mcp-server
```

## Step 4: Deploy Updated Code

```bash
# Commit and push to trigger GitHub Actions deployment
git add .
git commit -m "Add OAuth proxy support"
git push origin main
```

Or deploy manually:

```bash
flyctl deploy --app ownerrez-mcp-server
```

## Step 5: Verify Database Initialization

```bash
# Check logs to confirm migrations ran
flyctl logs --app ownerrez-mcp-server

# You should see:
# 🔄 Running database migrations...
# Running migration: 001_initial_schema.sql
# ✅ Migration 001_initial_schema.sql completed
# ✅ Database initialized
```

## Using the OAuth Proxy

### For End Users

#### Step 1: Generate an API Key

```bash
curl -X POST https://ownerrez-mcp-server.fly.dev/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"my-laptop"}'
```

Response:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "api_key": "ownerrez_sk_abc123def456...",
  "message": "Store this API key securely. It will not be shown again."
}
```

**⚠️ Save this API key! It cannot be retrieved again.**

#### Step 2: Start OwnerRez Authorization

```bash
curl https://ownerrez-mcp-server.fly.dev/api/connect/ownerrez/start \
  -H "Authorization: Bearer ownerrez_sk_abc123def456..."
```

Response:
```json
{
  "authorization_url": "https://app.ownerrez.com/oauth/authorize?...",
  "state": "...",
  "message": "Visit this URL to authorize OwnerRez"
}
```

#### Step 3: Authorize in Browser

1. Visit the `authorization_url` from the response
2. Log in to OwnerRez (if not already logged in)
3. Click "Authorize" to grant access
4. You'll see a success page

#### Step 4: Verify Connection

```bash
curl https://ownerrez-mcp-server.fly.dev/api/connect/ownerrez/status \
  -H "Authorization: Bearer ownerrez_sk_abc123def456..."
```

Response:
```json
{
  "connected": true,
  "ownerrez_user_id": 123456,
  "connected_at": "2025-10-11T12:00:00Z",
  "expires_at": null
}
```

#### Step 5: Configure MCP Client

**For Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "ownerrez": {
      "url": "https://ownerrez-mcp-server.fly.dev/mcp",
      "headers": {
        "Authorization": "Bearer ownerrez_sk_abc123def456..."
      }
    }
  }
}
```

**For Cursor** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "ownerrez": {
      "url": "https://ownerrez-mcp-server.fly.dev/mcp",
      "headers": {
        "Authorization": "Bearer ownerrez_sk_abc123def456..."
      }
    }
  }
}
```

**For ChatGPT**:
1. Go to ChatGPT Settings → Custom GPTs
2. Add MCP Connector
3. URL: `https://ownerrez-mcp-server.fly.dev/mcp`
4. Add header: `Authorization: Bearer ownerrez_sk_abc123def456...`

#### Step 6: Test Connection

In your MCP client, try:
```
Get my OwnerRez user information
```

This should return your OwnerRez user details if everything is working correctly!

### Revoking Access

To disconnect your OwnerRez account:

```bash
curl -X DELETE https://ownerrez-mcp-server.fly.dev/api/connect/ownerrez \
  -H "Authorization: Bearer ownerrez_sk_abc123def456..."
```

## API Endpoints Reference

### POST /api/users/register

Generate a new API key.

**Request:**
```json
{
  "name": "optional-key-name"
}
```

**Response:**
```json
{
  "user_id": "uuid",
  "api_key": "ownerrez_sk_...",
  "message": "Store this API key securely..."
}
```

### GET /api/connect/ownerrez/start

Get OwnerRez authorization URL.

**Headers:**
- `Authorization: Bearer <api_key>`

**Response:**
```json
{
  "authorization_url": "https://app.ownerrez.com/oauth/authorize?...",
  "state": "...",
  "message": "Visit this URL to authorize OwnerRez"
}
```

### GET /api/connect/ownerrez/callback

OAuth callback endpoint (called by OwnerRez after user authorizes).

**Query Parameters:**
- `code`: Authorization code
- `state`: OAuth state for CSRF protection

**Response:** HTML success/error page

### GET /api/connect/ownerrez/status

Check OwnerRez connection status.

**Headers:**
- `Authorization: Bearer <api_key>`

**Response:**
```json
{
  "connected": true,
  "ownerrez_user_id": 123456,
  "connected_at": "2025-10-11T...",
  "expires_at": null
}
```

### DELETE /api/connect/ownerrez

Revoke OwnerRez connection.

**Headers:**
- `Authorization: Bearer <api_key>`

**Response:**
```json
{
  "message": "OwnerRez connection revoked successfully"
}
```

## Database Schema

### users
- `id` (UUID, primary key)
- `created_at` (timestamp)

### api_keys
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → users.id)
- `key_hash` (text, bcrypt hash)
- `key_prefix` (text, first 16 chars for display)
- `name` (text, optional)
- `last_used_at` (timestamp)
- `created_at` (timestamp)

### ownerrez_connections
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → users.id, unique)
- `access_token` (text, encrypted)
- `refresh_token` (text, encrypted, optional)
- `token_type` (text, default 'bearer')
- `user_id_ownerrez` (integer)
- `expires_at` (timestamp, optional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### oauth_states
- `state` (text, primary key)
- `user_id` (UUID, foreign key → users.id)
- `created_at` (timestamp)
- `expires_at` (timestamp)

## Security Features

1. **API Key Hashing**: Keys are hashed with bcrypt before storage
2. **Token Encryption**: OwnerRez tokens are encrypted at rest with AES-256-GCM
3. **OAuth State Validation**: CSRF protection via state parameter
4. **Key Prefix Display**: Only first 16 characters shown in logs
5. **Automatic State Cleanup**: Expired OAuth states are removed
6. **HTTPS Only**: All connections require HTTPS in production

## Troubleshooting

### "DATABASE_URL not set"

The database wasn't attached correctly. Run:
```bash
flyctl postgres attach ownerrez-mcp-db --app ownerrez-mcp-server
```

### "ENCRYPTION_KEY environment variable is not set"

Set the encryption key:
```bash
flyctl secrets set ENCRYPTION_KEY="$(openssl rand -base64 32)" --app ownerrez-mcp-server
```

### "Invalid API key"

The API key was entered incorrectly or has been revoked. Generate a new one with `/api/users/register`.

### "No OwnerRez connection found for user"

The user hasn't authorized OwnerRez yet. Complete the authorization flow:
1. GET `/api/connect/ownerrez/start`
2. Visit the authorization URL
3. Authorize in browser

### Database Connection Errors

Check database status:
```bash
flyctl postgres status --app ownerrez-mcp-db
```

View database logs:
```bash
flyctl postgres logs --app ownerrez-mcp-db
```

## Maintenance

### View Active Users

```bash
flyctl ssh console --app ownerrez-mcp-server

# In the console:
psql $DATABASE_URL

SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM ownerrez_connections;
```

### Clean Up Expired OAuth States

States are automatically cleaned up, but you can manually run:
```sql
DELETE FROM oauth_states WHERE expires_at < NOW();
```

## Migration from Legacy OAuth

If users were previously using the shared OAuth configuration with `oauthClientId` in their config:

1. They can continue using that method (still supported)
2. OR they can migrate to the OAuth proxy:
   - Generate an API key
   - Authorize their OwnerRez account
   - Update their config to use the Authorization header instead of `oauthClientId`

Both methods work simultaneously!

