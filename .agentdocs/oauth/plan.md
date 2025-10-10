<!-- e48aa614-ace2-41c1-8f4e-a65e2887a0a9 55eee78d-c205-4cea-ae68-558369bf3374 -->
# Set Up HTTP OAuth for OwnerRez MCP Server in Cursor

## Current State

- MCP server has HTTP mode infrastructure but lacks OAuth callback endpoint
- OAuth metadata router exists but doesn't handle token exchange
- Stdio mode doesn't support OAuth callbacks
- `exchange-token.mjs` includes `redirect_uri` parameter which causes 403 errors per OAUTH_SETUP.md

## Implementation Plan

### 1. Add OAuth Callback Endpoint

**File**: `src/index.ts`

Add `/oauth/callback` endpoint in HTTP mode section that:

- Receives authorization code from OwnerRez
- Calls `client.exchangeCodeForToken()` WITHOUT redirect_uri (per docs)
- Returns success page with token or stores it per session
- Handles errors gracefully

### 2. Fix Token Exchange Implementation  

**File**: `src/client.ts`

The `exchangeCodeForToken` method should NOT include `redirect_uri` parameter (line 43-64) because OwnerRez returns 403 when it's included (documented quirk in OAUTH_SETUP.md line 126).

### 3. Add Session/Token Management

**Options**:

- Simple in-memory token storage per session ID
- Display token on callback page for manual copying
- Auto-inject token into MCP server instance

Choose simpler approach: Display token on callback page for user to copy into config.

### 4. Create Cursor MCP Configuration

**File**: New `.cursor/mcp.json` or update Cursor settings

Configure to connect to HTTP server:

```json
{
  "mcpServers": {
    "ownerrez": {
      "url": "http://localhost:3000/mcp",
      "env": {
        "OWNERREZ_CLIENT_ID": "c_xxx",
        "OWNERREZ_CLIENT_SECRET": "s_xxx"
      }
    }
  }
}
```

### 5. Add Development Scripts

**File**: `package.json`

Add script to run in HTTP mode:

```json
"dev:http": "TRANSPORT_MODE=http npm run dev"
```

### 6. Update Documentation

**File**: `README.md`

Add Cursor/VSCode setup section with:

- How to start HTTP server
- How to configure Cursor
- OAuth flow walkthrough
- Troubleshooting steps

### 7. Testing Workflow Documentation

Create clear steps:

1. Start server in HTTP mode: `npm run dev:http`
2. Configure Cursor with HTTP endpoint
3. Visit OAuth URL to authorize
4. Get token from callback page
5. Update Cursor config with token
6. Restart Cursor MCP connection
7. Test with simple tool call

## Key Changes

- `src/index.ts`: Add `/oauth/callback` endpoint
- `src/client.ts`: Remove `redirect_uri` from token exchange
- `package.json`: Add `dev:http` script
- `.cursor/mcp.json`: Create Cursor config example
- `README.md`: Add Cursor setup section

## Testing Checklist

- [x] OAuth authorization URL generation works
- [x] Callback receives code correctly
- [x] Token exchange succeeds (no 403)
- [x] Token displayed to user
- [ ] Cursor connects to HTTP server
- [ ] MCP tools work with OAuth token

### To-dos

- [x] Remove redirect_uri parameter from exchangeCodeForToken method to fix 403 errors
- [x] Add /oauth/callback endpoint to HTTP server that exchanges code for token
- [x] Add dev:http npm script to easily run server in HTTP mode
- [x] Create example Cursor MCP configuration file
- [x] Add Cursor/VSCode setup and testing workflow documentation to README

