# Cursor/VSCode Setup Guide for OwnerRez MCP Server

This guide will help you set up the OwnerRez MCP server in Cursor/VSCode with OAuth authentication for rapid testing and development.

## Prerequisites

- Node.js 18+ installed
- OwnerRez OAuth App created with Client ID and Client Secret
- Cursor or VSCode installed

## Quick Setup (5 minutes)

### Step 1: Get Your OAuth Access Token

First, we need to obtain an access token using the HTTP server:

1. **Start the HTTP server:**
   ```bash
   cd /Users/dustinrasener/source/ownerrez-mcp-server
   npm run dev:http
   ```
   
   You should see:
   ```
   OwnerRez MCP Server running on HTTP port 3000
   OAuth metadata available at: http://localhost:3000/.well-known/oauth-authorization-server
   ```

2. **Get the authorization URL:**
   
   **Option A - Using the helper script (easiest):**
   ```bash
   npm run oauth:url YOUR_CLIENT_ID
   ```
   
   **Option B - Manual URL:**
   
   Replace `YOUR_CLIENT_ID` with your actual OwnerRez client ID:
   ```
   https://app.ownerrez.com/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/oauth/callback
   ```
   
   Then open the URL in your browser.

3. **Authorize the application:**
   - Log into OwnerRez if prompted
   - Review the permissions requested
   - Click "Authorize"

4. **Copy your access token:**
   - You'll be redirected to a success page
   - Copy the access token displayed (starts with `at_`)
   - Click the "📋 Copy Token" button for easy copying

5. **Stop the HTTP server:**
   ```
   Press Ctrl+C in the terminal
   ```

### Step 2: Configure Cursor

1. **Create your MCP configuration file:**
   
   Copy the example and edit it with your credentials:
   ```bash
   cp .cursor/mcp.example.json .cursor/mcp.json
   ```
   
   Then edit `.cursor/mcp.json` with your actual values:
   ```json
   {
     "mcpServers": {
       "ownerrez": {
         "command": "node",
         "args": [
           "/Users/dustinrasener/source/ownerrez-mcp-server/build/index.js"
         ],
         "env": {
           "OWNERREZ_CLIENT_ID": "c_your_actual_client_id",
           "OWNERREZ_CLIENT_SECRET": "s_your_actual_client_secret",
           "OWNERREZ_REDIRECT_URI": "http://localhost:3000/oauth/callback",
           "OWNERREZ_ACCESS_TOKEN": "at_your_access_token_from_step_1"
         }
       }
     }
   }
   ```

2. **Add to Cursor settings:**
   
   The MCP configuration needs to be added to Cursor's settings:
   
   - Open Cursor Settings (Cmd+, on Mac, Ctrl+, on Windows)
   - Click "Cursor Settings" or press Cmd+Shift+J (Mac) / Ctrl+Shift+J (Windows)
   - Navigate to "Features" → "Model Context Protocol"
   - Click "Edit Config" or add a new server
   - Paste the configuration from `.cursor/mcp.json`
   
   Alternatively, you can edit the settings JSON directly:
   - Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P)
   - Type "Preferences: Open User Settings (JSON)"
   - Add the `mcpServers` section

### Step 3: Restart Cursor

1. Fully quit and restart Cursor
2. The MCP server will start automatically in stdio mode

### Step 4: Test the Connection

1. Open the chat/composer in Cursor
2. Try asking: **"Get my OwnerRez user information"**
3. You should receive your user details from OwnerRez

**Success! 🎉** The MCP server is now connected and working.

## Iterative Testing Workflow

When you make changes to the MCP server code:

1. **Make your code changes** in `src/`
2. **Rebuild the project:**
   ```bash
   npm run build
   ```
3. **Restart Cursor** or reconnect the MCP server
4. **Test your changes** through the Cursor chat

## Viewing Logs

To debug issues, view the MCP server logs:

**MacOS:**
```bash
tail -f ~/Library/Logs/Cursor/*.log
```

**Windows:**
```
%APPDATA%\Cursor\logs\
```

Look for error messages related to the OwnerRez MCP server.

## Troubleshooting

### "Server not showing up in Cursor"

1. Check that the path in `.cursor/mcp.json` is correct and absolute
2. Ensure the `build/index.js` file exists (run `npm run build`)
3. Fully quit and restart Cursor (not just reload window)
4. Check Cursor logs for error messages

### "403 Forbidden during token exchange"

This usually means `redirect_uri` was included in the token exchange request. The code in this repo has been fixed to exclude it.

### "401 Unauthorized when calling tools"

1. Verify your access token is correct in `.cursor/mcp.json`
2. Check that the token hasn't been revoked in OwnerRez
3. Get a new token by repeating Step 1

### "Token expired" or "Invalid token"

OwnerRez tokens are long-lived but can be revoked. Get a new token:
1. Start HTTP server: `npm run dev:http`
2. Visit the authorization URL again
3. Copy the new token
4. Update `.cursor/mcp.json`
5. Restart Cursor

### "Cannot find module" errors

Make sure you've built the project:
```bash
npm install
npm run build
```

## Testing Different OAuth Scenarios

### Testing with a fresh token

1. Revoke your current token (optional):
   ```bash
   curl -u YOUR_CLIENT_ID:YOUR_CLIENT_SECRET \
     -X DELETE https://api.ownerrez.com/oauth/access_token/YOUR_ACCESS_TOKEN
   ```

2. Get a new token using Step 1 above

### Testing error handling

You can test OAuth error scenarios by:
1. Using an invalid client ID in the authorization URL (should show error page)
2. Using an expired authorization code (should show token exchange error)
3. Using an invalid access token in Cursor config (should show 401 errors)

## Advanced: Using HTTP Mode in Cursor

While stdio mode is recommended, you can also test with HTTP mode:

1. **Start HTTP server:**
   ```bash
   npm run dev:http
   ```

2. **Configure Cursor to use HTTP endpoint:**
   ```json
   {
     "mcpServers": {
       "ownerrez": {
         "url": "http://localhost:3000/mcp"
       }
     }
   }
   ```

3. **Keep the server running** while using Cursor

Note: HTTP mode requires the server to be running continuously, so stdio mode is usually more convenient.

## Next Steps

- Read the full [README.md](./README.md) for all available tools
- Check [OAUTH_SETUP.md](./OAUTH_SETUP.md) for detailed OAuth documentation
- Explore the [OwnerRez API docs](https://api.ownerrez.com/help/v2)

## Support

If you encounter issues:
1. Check the logs in `~/Library/Logs/Cursor/` (Mac) or `%APPDATA%\Cursor\logs\` (Windows)
2. Verify your OAuth credentials are correct
3. Ensure your IP isn't blocked by OwnerRez
4. Open an issue on GitHub with log details

