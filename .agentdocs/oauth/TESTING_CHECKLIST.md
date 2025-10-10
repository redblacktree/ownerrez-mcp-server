# Testing Checklist - OAuth Implementation

Use this checklist to verify the OAuth implementation is working correctly.

## Pre-Testing Setup

- [ ] Node.js 18+ installed
- [ ] Repository cloned: `/Users/dustinrasener/source/ownerrez-mcp-server`
- [ ] Dependencies installed: `npm install`
- [ ] Project builds successfully: `npm run build`
- [ ] OwnerRez OAuth App created with Client ID and Client Secret
- [ ] OAuth redirect URI set to: `http://localhost:3000/oauth/callback`

## Test 1: HTTP Server Starts

**Goal**: Verify the HTTP server starts correctly

```bash
npm run dev:http
```

**Expected**:
- [ ] Server starts without errors
- [ ] Console shows: `OwnerRez MCP Server running on HTTP port 3000`
- [ ] Console shows: `OAuth metadata available at: http://localhost:3000/.well-known/oauth-authorization-server`
- [ ] Server stays running (doesn't crash)

**Cleanup**: Press Ctrl+C to stop server

## Test 2: OAuth URL Generation

**Goal**: Verify OAuth URL helper works

```bash
npm run oauth:url YOUR_CLIENT_ID
```

**Expected**:
- [ ] Script runs without errors
- [ ] Shows Client ID correctly
- [ ] Shows redirect URI: `http://localhost:3000/oauth/callback`
- [ ] Displays authorization URL starting with `https://app.ownerrez.com/oauth/authorize`
- [ ] URL includes `response_type=code`
- [ ] URL includes `client_id=YOUR_CLIENT_ID`
- [ ] URL includes `redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth%2Fcallback`

## Test 3: OAuth Callback - Error Handling

**Goal**: Verify error handling works

**Test 3a: Missing Code**

1. [ ] Start HTTP server: `npm run dev:http`
2. [ ] Visit: `http://localhost:3000/oauth/callback`
3. [ ] Expected: Error page showing "Missing Authorization Code"
4. [ ] Page has red error styling
5. [ ] Error message is clear

**Test 3b: Simulated Error**

1. [ ] Visit: `http://localhost:3000/oauth/callback?error=access_denied&error_description=User%20declined`
2. [ ] Expected: Error page showing "Authorization Failed"
3. [ ] Shows error: `access_denied`
4. [ ] Shows description: `User declined`

## Test 4: Complete OAuth Flow

**Goal**: Successfully obtain an access token

**Steps**:

1. [ ] Start HTTP server: `npm run dev:http`

2. [ ] Generate and copy OAuth URL:
   ```bash
   npm run oauth:url YOUR_CLIENT_ID
   ```

3. [ ] Open URL in browser

4. [ ] Login to OwnerRez (if not already logged in)
   - [ ] Login page loads
   - [ ] Credentials accepted

5. [ ] Review authorization page
   - [ ] App name displayed correctly
   - [ ] Permissions listed
   - [ ] "Authorize" button visible

6. [ ] Click "Authorize"

7. [ ] Callback page loads
   - [ ] URL is `http://localhost:3000/oauth/callback?code=tc_...`
   - [ ] Success page displays (green styling)
   - [ ] Access token shown (starts with `at_`)
   - [ ] User ID shown (number)
   - [ ] "Copy Token" button works
   - [ ] Next steps instructions visible

8. [ ] Check server logs
   - [ ] Shows: "Exchanging authorization code for access token..."
   - [ ] Shows: "✅ Access token obtained successfully"
   - [ ] Shows: "User ID: [number]"
   - [ ] Shows: "Token: at_..."
   - [ ] No error messages

9. [ ] Copy access token for next tests

## Test 5: Cursor Configuration

**Goal**: Set up MCP in Cursor

1. [ ] Create config file:
   ```bash
   cp .cursor/mcp.example.json .cursor/mcp.json
   ```

2. [ ] Edit `.cursor/mcp.json`:
   - [ ] Set `OWNERREZ_CLIENT_ID` to your client ID
   - [ ] Set `OWNERREZ_CLIENT_SECRET` to your client secret
   - [ ] Set `OWNERREZ_ACCESS_TOKEN` to token from Test 4
   - [ ] Verify path in `args` is correct absolute path

3. [ ] Add to Cursor settings:
   - [ ] Open Cursor Settings
   - [ ] Find MCP Servers section
   - [ ] Add ownerrez server configuration
   - [ ] Save settings

4. [ ] Restart Cursor
   - [ ] Fully quit Cursor
   - [ ] Reopen Cursor
   - [ ] Wait for MCP server to initialize

## Test 6: MCP Server in Cursor

**Goal**: Verify MCP server connects and works

1. [ ] Check MCP server status in Cursor
   - [ ] Server appears in MCP servers list
   - [ ] Status shows "Connected" or "Running"
   - [ ] No error indicators

2. [ ] View server logs (if available)
   - [ ] Check `~/Library/Logs/Cursor/` (Mac) or `%APPDATA%\Cursor\logs\` (Windows)
   - [ ] Look for ownerrez-mcp-server logs
   - [ ] Verify no error messages

## Test 7: MCP Tools Work

**Goal**: Verify API calls succeed

**Test 7a: Get Current User**

1. [ ] In Cursor chat, type: "Get my OwnerRez user information"

2. [ ] Expected response:
   - [ ] Returns user data (JSON format)
   - [ ] Shows user ID
   - [ ] Shows email address
   - [ ] Shows user name
   - [ ] No error messages

**Test 7b: List Properties**

1. [ ] In Cursor chat, type: "List all my OwnerRez properties"

2. [ ] Expected response:
   - [ ] Returns list of properties (or empty array)
   - [ ] Each property has ID, name, address
   - [ ] No error messages

**Test 7c: OAuth URL Tool**

1. [ ] In Cursor chat, type: "Generate OwnerRez OAuth authorization URL"

2. [ ] Expected response:
   - [ ] Returns authorization URL
   - [ ] URL includes client ID from environment
   - [ ] URL includes redirect URI
   - [ ] Includes instructions

## Test 8: Error Handling

**Goal**: Verify proper error messages

**Test 8a: Invalid Token**

1. [ ] Edit `.cursor/mcp.json` and change access token to invalid value
2. [ ] Restart Cursor
3. [ ] Try: "Get my OwnerRez user information"
4. [ ] Expected: Error message about 401 Unauthorized or invalid token

**Test 8b: No Token**

1. [ ] Edit `.cursor/mcp.json` and remove access token
2. [ ] Restart Cursor
3. [ ] Try: "List properties"
4. [ ] Expected: Error message about missing authentication

## Test 9: Iterative Development

**Goal**: Verify the testing loop works

1. [ ] Make a small change to `src/client.ts` (e.g., add a console.log)
2. [ ] Run: `npm run build`
3. [ ] Build succeeds
4. [ ] Restart Cursor or reconnect MCP
5. [ ] Test a tool to verify change took effect
6. [ ] Revert change
7. [ ] Rebuild and verify

## Test 10: Documentation

**Goal**: Verify documentation is complete and accurate

- [ ] README.md has Cursor/VSCode section
- [ ] README.md references CURSOR_SETUP.md
- [ ] CURSOR_SETUP.md is complete and clear
- [ ] OAUTH_SETUP.md is accurate
- [ ] IMPLEMENTATION_SUMMARY.md describes all changes
- [ ] All file paths are correct
- [ ] All commands work as documented

## Success Criteria

All checkboxes should be checked for a successful implementation.

**Critical Tests** (must pass):
- Test 4: Complete OAuth Flow
- Test 5: Cursor Configuration
- Test 7a: Get Current User

**Important Tests** (should pass):
- Test 1: HTTP Server Starts
- Test 3: Error Handling
- Test 7b, 7c: Other MCP Tools

**Nice to Have**:
- Test 8: Error Handling
- Test 9: Iterative Development
- Test 10: Documentation

## Troubleshooting Reference

If any test fails, see:
1. CURSOR_SETUP.md - Troubleshooting section
2. README.md - Troubleshooting section
3. Server logs in Cursor logs directory
4. Console output from `npm run dev:http`

## Notes

- Tests should be run in order
- Some tests depend on previous tests completing successfully
- Keep the access token from Test 4 secure
- You can repeat Test 4 anytime to get a fresh token

