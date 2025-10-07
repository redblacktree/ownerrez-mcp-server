# Testing Guide

This guide explains how to test the OwnerRez MCP Server locally and in production.

## Prerequisites for Testing

1. **OwnerRez OAuth App Created**: See OAUTH_SETUP.md
2. **Access Token Obtained**: Complete OAuth flow to get access token
3. **Environment Configured**: .env file with all credentials
4. **MCP Client**: Claude Desktop or compatible MCP client

## Local Testing

### Step 1: Verify Build

```bash
cd ~/ownerrez-mcp-server
npm run build
```

Expected output: No errors, build completes successfully

### Step 2: Configure Claude Desktop

1. Open Claude Desktop configuration:
   - **MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

2. Add the server configuration (see claude_desktop_config.json example)

3. **Important**: Use absolute paths for the `args` field

4. Restart Claude Desktop

### Step 3: Verify Server is Running

Open Claude Desktop and check for:
- No error messages on startup
- Server appears in the MCP servers list (if your client shows this)

### Step 4: Test Basic Commands

Try these commands in Claude to test various tools:

#### Authentication Test
```
"Get my OwnerRez user information"
```
Expected: Returns your user details (id, email, name, etc.)

#### Properties Test
```
"List all my properties"
```
Expected: Returns array of property objects

```
"Get details for property ID 123"
```
Expected: Returns single property details (replace 123 with actual property ID)

#### Bookings Test
```
"Show me recent bookings"
```
Expected: Returns list of bookings

```
"List bookings for property 123"
```
Expected: Returns bookings filtered by property ID

#### Guests Test
```
"Search for guests with email john@example.com"
```
Expected: Returns guest records matching search

#### OAuth URL Test
```
"Generate an OAuth authorization URL"
```
Expected: Returns formatted URL for OAuth authorization

## Testing Without Access Token

If you haven't completed the OAuth flow yet, you can still test:

1. Configure MCP server without access token
2. Use the `get_oauth_url` tool to get authorization URL
3. Complete OAuth flow to get token
4. Update configuration with token
5. Restart and test authenticated endpoints

## Testing with ngrok

For testing OAuth callbacks locally:

### Step 1: Install and Start ngrok

```bash
# Install ngrok from https://ngrok.com/download
ngrok http 3000
```

### Step 2: Update OAuth App

1. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
2. Update your OwnerRez OAuth app redirect URI to:
   ```
   https://abc123.ngrok.io/oauth/callback
   ```

### Step 3: Update Environment

```env
OWNERREZ_REDIRECT_URI=https://abc123.ngrok.io/oauth/callback
```

### Step 4: Test OAuth Flow

Complete the OAuth flow with the ngrok URL

## Common Test Scenarios

### Scenario 1: List All Properties
```
User: "Show me all my properties"
Expected: List of properties with IDs, names, addresses
```

### Scenario 2: Check Recent Bookings
```
User: "What bookings do I have for January 2025?"
Expected: Filtered bookings for specified date range
```

### Scenario 3: Search Available Properties
```
User: "Find properties with 3 bedrooms that allow pets"
Expected: Search results matching criteria
```

### Scenario 4: Get Booking Details
```
User: "Get full details for booking 12345"
Expected: Complete booking object with guest info, charges, etc.
```

### Scenario 5: Manage Webhooks
```
User: "What webhook subscriptions do I have?"
Expected: List of active webhook subscriptions
```

### Scenario 6: View Reviews
```
User: "Show me reviews for property 123"
Expected: List of reviews with ratings and comments
```

## Error Testing

### Test Invalid Credentials
1. Set an invalid access token
2. Try any authenticated command
3. Expected: Clear error message about authentication

### Test Missing Required Parameters
```
User: "Get booking details"
```
Expected: Error or prompt for booking ID

### Test API Errors
Try commands that might fail:
- Non-existent booking ID
- Invalid property ID
- Malformed date ranges

Expected: Graceful error handling with clear messages

## Performance Testing

### Test Response Times
Try commands and note response times:
- Simple queries (get user info): < 1 second
- List operations: 1-3 seconds
- Complex searches: 2-5 seconds

### Test Pagination
For large datasets:
```
User: "List all bookings"
```
Note: OwnerRez API handles pagination. Large result sets should return appropriately.

## Production Testing (Fly.io)

### Step 1: Deploy to Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Launch (from project directory)
flyctl launch

# Set environment variables
flyctl secrets set OWNERREZ_CLIENT_ID=c_your_id
flyctl secrets set OWNERREZ_CLIENT_SECRET=s_your_secret
flyctl secrets set OWNERREZ_REDIRECT_URI=https://your-app.fly.dev/oauth/callback

# Deploy
flyctl deploy
```

### Step 2: Update OAuth App

Update your OwnerRez OAuth app redirect URI to:
```
https://your-app-name.fly.dev/oauth/callback
```

### Step 3: Test Production

Complete OAuth flow with production URL and test all scenarios above

## Monitoring and Logs

### Local Logs
MCP server logs to stderr. Check Claude Desktop logs or terminal output for:
- Connection messages
- Error messages
- API request/response info

### Production Logs (Fly.io)
```bash
# View logs
flyctl logs

# Follow logs in real-time
flyctl logs -f
```

## Troubleshooting Tests

### Server Not Starting
1. Check Claude Desktop logs
2. Verify absolute path to build/index.js
3. Ensure all dependencies installed
4. Verify .env file exists and is formatted correctly

### Authentication Errors
1. Verify OWNERREZ_ACCESS_TOKEN is set
2. Check token starts with "at_"
3. Ensure token hasn't been revoked
4. Try completing OAuth flow again

### Tools Not Available
1. Restart Claude Desktop
2. Check configuration syntax
3. Verify server built successfully
4. Check for TypeScript errors

### API Errors
1. Check OwnerRez API status
2. Verify API rate limits not exceeded
3. Ensure required parameters provided
4. Check for permission/subscription issues

## Test Checklist

Before considering testing complete:

- [ ] Server builds without errors
- [ ] Server starts successfully in MCP client
- [ ] OAuth URL generation works
- [ ] User info retrieval works (authentication test)
- [ ] List properties works
- [ ] Get single property works
- [ ] List bookings works
- [ ] Get single booking works
- [ ] List guests works
- [ ] Search properties works
- [ ] List quotes works
- [ ] List inquiries works
- [ ] Webhook operations work
- [ ] Error handling is graceful
- [ ] All required documentation exists
- [ ] OAuth flow tested end-to-end

## Reporting Issues

When reporting issues, include:
1. Command/query that failed
2. Full error message
3. Relevant logs
4. Environment (local/production)
5. MCP client version
6. Node.js version
7. Steps to reproduce

## Next Steps After Testing

1. Document any edge cases found
2. Add additional error handling if needed
3. Optimize frequently-used queries
4. Consider caching for performance
5. Set up monitoring for production
