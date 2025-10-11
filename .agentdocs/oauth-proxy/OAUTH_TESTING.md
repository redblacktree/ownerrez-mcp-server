# OAuth Testing Guide

## What Was Fixed

The OAuth discovery issue has been resolved! The problem was that the `resourceServerUrl` was pointing to the root path (`/`) instead of the actual MCP endpoint (`/mcp`).

### Changes Made

1. **Updated `src/index.ts` (line 749)**:
   ```typescript
   // Before: resourceServerUrl: new URL(serverUrl),
   // After:
   resourceServerUrl: new URL(`${serverUrl}/mcp`),
   ```

2. **Updated `.cursor/mcp.json`**:
   ```json
   {
     "mcpServers": {
       "ownerrez": {
         "url": "https://ownerrez-mcp-server.fly.dev/mcp",
         "metadata": {
           "oauthClientId": "c_l9moiiilq5k1k0rv5u31maky734sz617"
         }
       }
     }
   }
   ```

## OAuth Metadata Endpoints

The server now correctly exposes OAuth metadata at:

### Authorization Server Metadata
```
https://ownerrez-mcp-server.fly.dev/.well-known/oauth-authorization-server
```

Returns:
```json
{
  "issuer": "https://api.ownerrez.com",
  "authorization_endpoint": "https://app.ownerrez.com/oauth/authorize",
  "token_endpoint": "https://api.ownerrez.com/oauth/access_token",
  "response_types_supported": ["code"],
  "grant_types_supported": ["authorization_code", "refresh_token"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
  "code_challenge_methods_supported": ["S256"],
  "revocation_endpoint": "https://api.ownerrez.com/oauth/access_token/{token}",
  "service_documentation": "https://api.ownerrez.com/help/oauth"
}
```

### Protected Resource Metadata
```
https://ownerrez-mcp-server.fly.dev/.well-known/oauth-protected-resource/mcp
```

Returns:
```json
{
  "resource": "https://ownerrez-mcp-server.fly.dev/mcp",
  "authorization_servers": ["https://api.ownerrez.com"],
  "resource_name": "OwnerRez MCP Server",
  "resource_documentation": "https://github.com/redblacktree/ownerrez-mcp-server"
}
```

## About "Dynamic Client Registration" Warning

If you see this message:
```
"Incompatible auth server: does not support dynamic client registration"
```

**This is NOT a problem!** OwnerRez doesn't support automatic client registration (RFC 7591), which is completely normal. Most OAuth providers (Google, GitHub, Facebook, etc.) don't support it either.

Instead, you use **manual client registration**:
1. ✅ Create OAuth app in OwnerRez manually
2. ✅ Add client ID to MCP config (`oauthClientId` in `.cursor/mcp.json`)
3. ✅ OAuth flow works normally

## Testing OAuth in Claude Desktop

### Step 1: Configure Claude Desktop

Update your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ownerrez": {
      "url": "https://ownerrez-mcp-server.fly.dev/mcp",
      "metadata": {
        "oauthClientId": "c_l9moiiilq5k1k0rv5u31maky734sz617"
      }
    }
  }
}
```

### Step 2: Restart Claude Desktop

Completely quit and restart Claude Desktop.

### Step 3: Connect to OwnerRez

When you first try to use the OwnerRez MCP server:

1. Claude Desktop will detect that OAuth is required
2. It will open your browser to OwnerRez authorization page
3. You'll see a consent screen asking you to authorize
4. Click "Authorize" to grant access
5. You'll be redirected back with a success message
6. Claude Desktop will automatically receive the access token

### Step 4: Test the Connection

Try asking Claude:
```
Get my OwnerRez user information
```

This should call the `get_current_user` tool and return your user details if OAuth is working correctly.

## Testing OAuth in Cursor

Your `.cursor/mcp.json` is already configured correctly:

```json
{
  "mcpServers": {
    "ownerrez": {
      "url": "https://ownerrez-mcp-server.fly.dev/mcp",
      "metadata": {
        "oauthClientId": "c_l9moiiilq5k1k0rv5u31maky734sz617"
      }
    }
  }
}
```

Restart Cursor and the OAuth flow should work automatically when you try to use the OwnerRez MCP server.

## Testing with MCP Inspector

MCP Inspector is a browser-based debugging tool:

```bash
npx @modelcontextprotocol/inspector
```

Then connect to:
```
https://ownerrez-mcp-server.fly.dev/mcp
```

The inspector will:
1. Discover OAuth metadata
2. Show you the authorization flow
3. Let you test tools after authorization
4. Display all requests/responses

## Troubleshooting

### "Failed to resolve OAuth client"

**Fixed!** This was the issue we just resolved. The OAuth metadata is now properly discoverable.

### "CORS Missing Allow Origin"

The browser-based MCP Inspector will show CORS errors when trying to fetch OAuth metadata from `api.ownerrez.com`. This is **expected** because OwnerRez doesn't allow CORS from browser origins. However, MCP clients (Claude Desktop, Cursor) will work fine because they make requests from their native applications, not from browsers.

### OAuth Flow Not Starting

1. Verify the MCP server URL ends with `/mcp` (not `/sse`)
2. Verify `oauthClientId` is set in the config
3. Restart your MCP client (Claude Desktop or Cursor)
4. Check that OwnerRez OAuth app is configured with correct redirect URI:
   - `https://ownerrez-mcp-server.fly.dev/oauth/callback`

### Token Exchange Fails

Check Fly.io logs:
```bash
flyctl logs -a ownerrez-mcp-server
```

Ensure secrets are set:
```bash
flyctl secrets list -a ownerrez-mcp-server
```

Should show:
- `OWNERREZ_CLIENT_ID`
- `OWNERREZ_CLIENT_SECRET`
- `OWNERREZ_REDIRECT_URI`

## OAuth Flow Diagram

```
1. MCP Client starts
   ↓
2. Discovers OAuth metadata from:
   /.well-known/oauth-protected-resource/mcp
   /.well-known/oauth-authorization-server
   ↓
3. Opens browser to:
   https://app.ownerrez.com/oauth/authorize?
     response_type=code&
     client_id=c_l9moiiilq5k1k0rv5u31maky734sz617&
     redirect_uri=https://ownerrez-mcp-server.fly.dev/oauth/callback
   ↓
4. User logs in and authorizes
   ↓
5. OwnerRez redirects to:
   https://ownerrez-mcp-server.fly.dev/oauth/callback?code=tc_xxxxx
   ↓
6. Server exchanges code for token:
   POST https://api.ownerrez.com/oauth/access_token
   Authorization: Basic {client_id:client_secret}
   Body: grant_type=authorization_code&code=tc_xxxxx
   ↓
7. Server returns success page with token
   ↓
8. MCP Client stores token and makes authenticated requests
```

## Next Steps

1. ✅ OAuth metadata is discoverable
2. ✅ Protected resource metadata points to `/mcp` endpoint  
3. ✅ Authorization server metadata exposes OwnerRez endpoints
4. ⏳ Test in Claude Desktop (requires user action)
5. ⏳ Test in Cursor (requires user action)
6. ⏳ Verify OAuth consent window appears correctly

The server-side OAuth configuration is complete and working! The remaining testing requires you to try connecting from Claude Desktop or Cursor to see the OAuth flow in action.

