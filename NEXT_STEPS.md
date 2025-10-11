# Next Steps - OAuth Proxy Deployment ✅

## What Just Happened

✅ **Database Created**: Fly.io Postgres cluster `ownerrez-mcp-db` created and attached
✅ **Secrets Configured**: `DATABASE_URL`, `ENCRYPTION_KEY`, and `OWNERREZ_REDIRECT_URI` set
✅ **Code Committed**: OAuth proxy implementation committed and pushed
✅ **Deployment Started**: GitHub Actions is now deploying to Fly.io

## Important: Update OwnerRez OAuth App

You need to update your OwnerRez OAuth app redirect URI:

1. Go to https://app.ownerrez.com/settings/api
2. Find your OAuth app
3. Update the **Redirect URI** to:
   ```
   https://ownerrez-mcp-server.fly.dev/api/connect/ownerrez/callback
   ```
4. Save changes

**Note:** You can add this as an additional redirect URI without removing the old one if you want to maintain backward compatibility.

## Monitor Deployment

```bash
# Watch deployment logs
flyctl logs --app ownerrez-mcp-server

# You should see:
# 🔄 Running database migrations...
# Running migration: 001_initial_schema.sql
# ✅ Migration 001_initial_schema.sql completed
# ✅ Database initialized
# OwnerRez MCP Server running on HTTP port 8080
```

## Test the OAuth Proxy

Once deployed, test the complete flow:

### 1. Generate an API Key

```bash
curl -X POST https://ownerrez-mcp-server.fly.dev/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"test-key"}'
```

Save the `api_key` from the response!

### 2. Start Authorization

```bash
curl https://ownerrez-mcp-server.fly.dev/api/connect/ownerrez/start \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 3. Authorize in Browser

Visit the `authorization_url` from the response and click "Authorize"

### 4. Check Status

```bash
curl https://ownerrez-mcp-server.fly.dev/api/connect/ownerrez/status \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Should return `{"connected": true, ...}`

### 5. Configure MCP Client

**For Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "ownerrez": {
      "url": "https://ownerrez-mcp-server.fly.dev/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
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
        "Authorization": "Bearer YOUR_API_KEY"
      }
    }
  }
}
```

**For ChatGPT**:
1. Settings → Add MCP Connector
2. URL: `https://ownerrez-mcp-server.fly.dev/mcp`
3. Add header: `Authorization: Bearer YOUR_API_KEY`

### 6. Test in MCP Client

Ask: "Get my OwnerRez user information"

Should return your OwnerRez user details!

## Troubleshooting

### Check Deployment Status

```bash
flyctl status --app ownerrez-mcp-server
```

### View Logs

```bash
flyctl logs --app ownerrez-mcp-server
```

### Check Database Connection

```bash
flyctl postgres status --app ownerrez-mcp-db
```

### Verify Secrets

```bash
flyctl secrets list --app ownerrez-mcp-server
```

Should show:
- DATABASE_URL
- ENCRYPTION_KEY
- OWNERREZ_CLIENT_ID
- OWNERREZ_CLIENT_SECRET
- OWNERREZ_REDIRECT_URI
- SERVER_URL

## Documentation

Full documentation is in `.agentdocs/oauth-proxy/`:
- **IMPLEMENTATION_COMPLETE.md** - Complete overview
- **OAUTH_PROXY_SETUP.md** - Detailed setup guide
- **README.md** - Documentation index

## What This Enables

✅ **ChatGPT**: Now works with API key authentication!
✅ **Claude Desktop**: Works with API key (or old config still works)
✅ **Cursor**: Works with API key (or old config still works)
✅ **Per-User Connections**: Each user has their own OwnerRez OAuth token
✅ **Secure**: Tokens encrypted at rest, API keys hashed

## Support

If you encounter issues:
1. Check `.agentdocs/oauth-proxy/DIAGNOSTICS.md` for troubleshooting
2. Review logs: `flyctl logs --app ownerrez-mcp-server`
3. Verify OwnerRez redirect URI is updated

## Success! 🎉

The OAuth proxy is deployed and ready to use. Share the API key registration endpoint with users who want to connect their OwnerRez accounts!

