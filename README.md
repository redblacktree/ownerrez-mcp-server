# OwnerRez MCP Server

A Model Context Protocol (MCP) server that provides access to the OwnerRez API v2.0 with OAuth2 authentication. This server enables AI assistants like Claude to interact with your OwnerRez vacation rental management data.

## Features

- **OAuth2 Authentication**: Secure authentication flow following OAuth 2.0 Authorization Code Grant
- **Comprehensive API Coverage**: 30+ tools covering all major OwnerRez API endpoints
- **Property Management**: List, search, and retrieve property information
- **Booking Management**: Create, update, and query bookings
- **Guest Management**: Full CRUD operations for guest records
- **Quotes & Inquiries**: Access quotes and inquiry data
- **Webhooks**: Manage webhook subscriptions
- **Reviews & Listings**: Access property reviews and listing content
- **Custom Fields & Tags**: Manage tags and custom field definitions

## Prerequisites

1. **OwnerRez Account**: Active OwnerRez account
2. **OAuth App**: Create an OAuth app in OwnerRez (see [Setup Guide](#oauth-app-setup))
3. **Node.js**: Version 18 or higher
4. **MCP Client**: Claude Desktop or another MCP-compatible client

## Installation

### Option 1: Install from npm (Coming Soon)

```bash
npm install -g ownerrez-mcp-server
```

### Option 2: Install from Source

```bash
# Clone the repository
git clone <repository-url>
cd ownerrez-mcp-server

# Install dependencies
npm install

# Build the project
npm run build
```

## OAuth App Setup

Before using this MCP server, you need to create an OAuth app in OwnerRez:

1. **Contact OwnerRez**: Email `partnerhelp@ownerrez.com` to let them know you're creating an integration
2. **Create OAuth App**: 
   - Go to https://app.ownerrez.com/settings/api
   - Click "Create App"
   - Fill in the required fields:
     - **Name**: Your app name (e.g., "Claude MCP Integration")
     - **Homepage URL**: Your homepage or landing page
     - **OAuth Redirect URL**: For local testing, use `http://localhost:3000/oauth/callback`
     - **Webhook URL/User/Password**: Optional, for receiving webhooks
3. **Save Credentials**: 
   - Copy your **Client ID** (starts with `c_`)
   - Copy your **Client Secret** (starts with `s_`) - save this immediately as you won't be able to see it again!

## Configuration

### 1. Environment Variables

Create a `.env` file in the project directory:

```bash
cp .env.example .env
```

Edit `.env` with your OAuth credentials:

```env
OWNERREZ_CLIENT_ID=c_your_client_id_here
OWNERREZ_CLIENT_SECRET=s_your_client_secret_here
OWNERREZ_REDIRECT_URI=http://localhost:3000/oauth/callback
OWNERREZ_ACCESS_TOKEN=
```

### 2. Get Access Token

To use the MCP server, you need to obtain an access token through the OAuth flow:

#### Method 1: Using the MCP Tool

1. Configure the MCP server in your client (see below)
2. Use the `get_oauth_url` tool to get the authorization URL
3. Visit the URL in your browser and authorize the application
4. Exchange the authorization code for an access token (manual process)
5. Add the token to your `.env` file as `OWNERREZ_ACCESS_TOKEN`

#### Method 2: Manual OAuth Flow

```bash
# 1. Get the authorization URL
# Replace CLIENT_ID and REDIRECT_URI with your values
https://app.ownerrez.com/oauth/authorize?response_type=code&client_id=c_your_client_id&redirect_uri=http://localhost:3000/oauth/callback

# 2. Visit the URL and authorize
# 3. You'll be redirected to: http://localhost:3000/oauth/callback?code=tc_xxxxx

# 4. Exchange the code for a token (replace values)
curl -u c_your_client_id:s_your_secret \
  -d code=tc_xxxxx \
  -d grant_type=authorization_code \
  -d redirect_uri=http://localhost:3000/oauth/callback \
  -X POST https://api.ownerrez.com/oauth/access_token

# 5. Copy the access_token from the response to your .env file
```

### 3. Configure MCP Client

#### Claude Desktop

Add to your Claude Desktop configuration file:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ownerrez": {
      "command": "node",
      "args": ["/absolute/path/to/ownerrez-mcp-server/build/index.js"],
      "env": {
        "OWNERREZ_CLIENT_ID": "c_your_client_id",
        "OWNERREZ_CLIENT_SECRET": "s_your_secret",
        "OWNERREZ_REDIRECT_URI": "http://localhost:3000/oauth/callback",
        "OWNERREZ_ACCESS_TOKEN": "at_your_access_token"
      }
    }
  }
}
```

Restart Claude Desktop after updating the configuration.

#### Cursor / VSCode

**📖 Quick Start: See [CURSOR_SETUP.md](./.agentdocs/oauth/CURSOR_SETUP.md) for a detailed step-by-step guide**

Cursor and VSCode support MCP through their settings. Here's how to set it up:

**Option 1: Using Stdio Mode (Recommended for Cursor)**

1. Copy the example configuration:
```bash
cp .cursor/mcp.example.json .cursor/mcp.json
```

2. Edit `.cursor/mcp.json` with your credentials:
```json
{
  "mcpServers": {
    "ownerrez": {
      "command": "node",
      "args": ["/absolute/path/to/ownerrez-mcp-server/build/index.js"],
      "env": {
        "OWNERREZ_CLIENT_ID": "c_your_client_id",
        "OWNERREZ_CLIENT_SECRET": "s_your_client_secret",
        "OWNERREZ_REDIRECT_URI": "http://localhost:3000/oauth/callback",
        "OWNERREZ_ACCESS_TOKEN": "at_your_access_token"
      }
    }
  }
}
```

3. Get your access token using HTTP mode (see below)

4. Restart Cursor to load the MCP server

**Option 2: Getting OAuth Token via HTTP Mode**

This is the easiest way to get your access token:

1. Start the server in HTTP mode:
```bash
npm run dev:http
```

2. The server will start on `http://localhost:3000`

3. Visit the authorization URL:
```
http://localhost:3000/.well-known/oauth-authorization-server
```
Or construct it manually:
```
https://app.ownerrez.com/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/oauth/callback
```

4. After authorizing in OwnerRez, you'll be redirected to a success page showing your access token

5. Copy the access token and add it to your MCP configuration

6. Stop the HTTP server (Ctrl+C) and restart Cursor in stdio mode

**Testing the Connection**

Once configured, you can test the MCP server:
1. Open Cursor
2. Look for "OwnerRez" in the MCP servers list
3. Try a command like: "Get my OwnerRez user information"

## Available Tools

### Authentication
- `get_oauth_url` - Get OAuth authorization URL

### Bookings
- `list_bookings` - Query bookings with filters
- `get_booking` - Get single booking details
- `create_booking` - Create new booking
- `update_booking` - Update existing booking

### Properties
- `list_properties` - List all properties
- `get_property` - Get single property details
- `search_properties` - Search properties with availability

### Guests
- `list_guests` - Query guests
- `get_guest` - Get guest details
- `create_guest` - Create new guest
- `update_guest` - Update guest
- `delete_guest` - Delete guest

### Quotes & Inquiries
- `list_quotes` - Get all quotes
- `get_quote` - Get quote details
- `list_inquiries` - Get all inquiries
- `get_inquiry` - Get inquiry details

### Owners
- `list_owners` - List all owners
- `get_owner` - Get owner details

### User
- `get_current_user` - Get authenticated user info

### Webhooks
- `list_webhook_subscriptions` - List webhook subscriptions
- `get_webhook_subscription` - Get webhook details
- `create_webhook_subscription` - Create webhook
- `delete_webhook_subscription` - Delete webhook
- `get_webhook_categories` - Get available webhook categories

### Reviews & Listings
- `list_reviews` - Get property reviews
- `get_review` - Get review details
- `list_listings` - Get property listings
- `get_listing` - Get listing details

### Tags & Fields
- `list_tag_definitions` - Get tag definitions
- `get_tag_definition` - Get tag definition
- `create_tag_definition` - Create tag definition
- `list_field_definitions` - Get field definitions

## Usage Examples

Once configured, you can interact with OwnerRez through your MCP client:

```
"Show me all active properties"
"List bookings for property ID 12345 from January 2025"
"Get details for booking 67890"
"Search for properties with 3+ bedrooms that allow pets"
"Show me recent inquiries"
"Create a new guest record for John Doe"
```

## Development & Testing Workflow

### Quick Start: Testing OAuth in Cursor

This workflow allows for rapid iteration when testing OAuth:

**Step 1: Get Your OAuth Token**

1. Start the HTTP server:
```bash
npm run dev:http
```

2. Open your browser and navigate to the authorization URL (replace with your client ID):
```
https://app.ownerrez.com/oauth/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/oauth/callback
```

3. Log into OwnerRez and authorize the application

4. You'll be redirected to `http://localhost:3000/oauth/callback` and see a success page with your access token

5. Copy the access token from the page

**Step 2: Configure Cursor**

1. Edit `.cursor/mcp.json` and add your credentials:
```json
{
  "mcpServers": {
    "ownerrez": {
      "command": "node",
      "args": ["/absolute/path/to/ownerrez-mcp-server/build/index.js"],
      "env": {
        "OWNERREZ_CLIENT_ID": "c_your_client_id",
        "OWNERREZ_CLIENT_SECRET": "s_your_client_secret",
        "OWNERREZ_REDIRECT_URI": "http://localhost:3000/oauth/callback",
        "OWNERREZ_ACCESS_TOKEN": "at_your_access_token_from_step_1"
      }
    }
  }
}
```

2. Stop the HTTP server (Ctrl+C)

**Step 3: Test in Cursor**

1. Restart Cursor to load the MCP server
2. The server will start automatically in stdio mode
3. Test with: "Get my OwnerRez user information"

**Step 4: Iterative Testing**

When you make code changes:

1. Make your changes to the source code
2. Rebuild: `npm run build`
3. Restart the MCP connection in Cursor (or restart Cursor)
4. Test your changes

**Viewing Logs**

MCP server logs in Cursor can be found in:
- **MacOS**: `~/Library/Logs/Cursor/`
- **Windows**: `%APPDATA%\Cursor\logs\`

Look for files related to the MCP server or stdio output.

## Deployment

### Local Development

```bash
npm run dev
```

### Production (Fly.io)

1. Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Login: `flyctl auth login`
3. Create app: `flyctl launch`
4. Set secrets:
   ```bash
   flyctl secrets set OWNERREZ_CLIENT_ID=c_your_id
   flyctl secrets set OWNERREZ_CLIENT_SECRET=s_your_secret
   flyctl secrets set OWNERREZ_REDIRECT_URI=https://your-app.fly.dev/oauth/callback
   ```
5. Deploy: `flyctl deploy`

### Using ngrok for Local Testing

For OAuth callback testing during development:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000

# Update your OAuth app's redirect URI to the ngrok URL
# Example: https://abc123.ngrok.io/oauth/callback
```

## Troubleshooting

### "403 Forbidden" Error

403 errors often occur due to:
- Missing User-Agent header (handled automatically by this server)
- Blocked IP address
- Invalid credentials

Contact OwnerRez support if you suspect your IP is blocked.

### "401 Unauthorized" Error

- Check that your `OWNERREZ_ACCESS_TOKEN` is set correctly
- Verify the token hasn't been revoked
- Ensure you completed the OAuth flow successfully

### Token Expired

Access tokens from OwnerRez are long-lived and don't expire unless revoked. If your token stops working:
1. Check if the user revoked access in OwnerRez
2. Complete the OAuth flow again to get a new token

### MCP Server Not Showing Up

1. Check Claude Desktop logs for errors
2. Verify the path to `build/index.js` is correct and absolute
3. Ensure all environment variables are set
4. Restart Claude Desktop

## API Rate Limiting

OwnerRez implements rate limiting on their API. The server will return appropriate error messages if you hit rate limits. See: https://www.ownerrez.com/support/articles/api-rate-limiting

## Security Notes

- **Never commit** your `.env` file or expose your Client Secret
- Store access tokens securely
- Use HTTPS for production redirect URIs
- Regularly rotate your Client Secret if compromised

## Premium Features

Some endpoints require premium OwnerRez features:
- **Messaging**: Requires messaging partnership agreement
- **Listings**: Requires WordPress Plugin + Integrated Websites feature

Contact OwnerRez at `partnerhelp@ownerrez.com` for access.

## Development

```bash
# Watch mode for development
npm run watch

# Build
npm run build

# Run
npm start
```

## Resources

- [OwnerRez API Documentation](https://api.ownerrez.com/help/v2)
- [OAuth Documentation](https://api.ownerrez.com/help/oauth)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Claude Desktop](https://claude.ai/desktop)

## License

MIT

## Support

For issues with:
- **This MCP Server**: Open an issue on GitHub
- **OwnerRez API**: Contact help@ownerrez.com
- **OAuth Setup**: Contact partnerhelp@ownerrez.com
