# OAuth Architecture: Shared vs Per-User Client Credentials

## The Key Question

**Why don't you need to provide a client ID for Gmail in Claude Desktop, but you do for OwnerRez?**

## Two Different OAuth Architectures

### Architecture 1: Per-User OAuth App (Gmail Pattern)

**How it works:**
1. **Each user** creates their own OAuth app in Google Cloud Console
2. **Each user** gets their own `client_id` and `client_secret`
3. **Each user** runs their own MCP server locally with their credentials
4. MCP server embeds the credentials in its configuration

**Example: Gmail MCP Server Config**
```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "@gongrzhe/server-gmail-autoauth-mcp"],
      "env": {
        "GMAIL_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GMAIL_CLIENT_SECRET": "your-client-secret"
      }
    }
  }
}
```

**Note:** The client ID/secret are passed as environment variables to the MCP server itself, not as metadata for Claude Desktop to use.

**Pros:**
- ✅ Each user has isolated credentials
- ✅ No single point of failure
- ✅ User controls their own OAuth app
- ✅ Works with Claude Desktop, Cursor, ChatGPT

**Cons:**
- ❌ Complex setup (user must create OAuth app)
- ❌ Requires Google Cloud Console knowledge
- ❌ Each user manages their own credentials
- ❌ Can't use dynamic client registration

### Architecture 2: Shared OAuth App (Our Current OwnerRez Pattern)

**How it works:**
1. **One person** creates an OAuth app in OwnerRez
2. **One shared** `client_id` is used by all users
3. MCP server is deployed centrally (e.g., Fly.io)
4. Users connect to the shared server

**Example: OwnerRez MCP Server Config**
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

**Note:** The client ID is provided to Claude Desktop/Cursor as metadata so they know which client to use when initiating OAuth. The server stores the client secret.

**Pros:**
- ✅ Simple user setup (just add config)
- ✅ No OAuth app creation needed
- ✅ Centrally managed server
- ✅ Works with Cursor and Claude Desktop

**Cons:**
- ❌ Requires MCP client to support `oauthClientId` metadata
- ❌ ChatGPT doesn't support this yet
- ❌ Single OAuth app for all users
- ❌ Requires server deployment

## Why the Difference?

### Gmail Scenario
- **Google allows unlimited OAuth apps** - anyone can create one
- **MCP server runs locally** on user's machine
- **User owns the data** (their Gmail account)
- **Security model**: User manages their own credentials

### OwnerRez Scenario
- **OwnerRez limits OAuth apps** - must request from partner team
- **MCP server deployed centrally** on Fly.io
- **Provider owns the data** (OwnerRez account)
- **Security model**: Shared app, per-user tokens

## Could We Use the Gmail Pattern?

**Yes, but it would require:**

1. **Each user creates their own OwnerRez OAuth app:**
   - Contact partnerhelp@ownerrez.com
   - Get approved for OAuth app
   - Receive client ID and secret
   
2. **Each user runs the MCP server locally:**
   ```bash
   OWNERREZ_CLIENT_ID=their_client_id \
   OWNERREZ_CLIENT_SECRET=their_secret \
   OWNERREZ_REDIRECT_URI=http://localhost:3000/oauth/callback \
   node build/index.js
   ```

3. **Config would look like:**
   ```json
   {
     "mcpServers": {
       "ownerrez": {
         "command": "node",
         "args": ["/path/to/ownerrez-mcp-server/build/index.js"],
         "env": {
           "OWNERREZ_CLIENT_ID": "c_user_specific_id",
           "OWNERREZ_CLIENT_SECRET": "s_user_specific_secret",
           "OWNERREZ_REDIRECT_URI": "http://localhost:3000/oauth/callback",
           "TRANSPORT_MODE": "stdio"
         }
       }
     }
   }
   ```

**This would work with ChatGPT!** Because the MCP server itself knows the client ID/secret.

## MCP OAuth Flow Comparison

### Gmail Pattern (Server Knows Credentials)
```
1. Claude Desktop starts MCP server with env vars
   ↓
2. Server receives CLIENT_ID and CLIENT_SECRET
   ↓
3. Server exposes OAuth metadata (includes auth endpoints)
   ↓
4. Claude Desktop initiates OAuth flow
   ↓
5. SERVER handles authorization URL construction
   ↓
6. SERVER exchanges code for token
   ↓
7. Claude Desktop never knows client secret ✅
```

### Our Current Pattern (Client Needs Client ID)
```
1. Claude Desktop connects to running server
   ↓
2. Server exposes OAuth metadata (auth endpoints only)
   ↓
3. Claude Desktop reads oauthClientId from config
   ↓
4. CLAUDE constructs authorization URL
   ↓
5. User authorizes, redirects to server
   ↓
6. Server exchanges code for token
   ↓
7. Claude Desktop uses the connection ✅
```

## Why ChatGPT Fails

**ChatGPT expects the Gmail pattern** where:
- MCP server knows its own client credentials
- OR OAuth server supports dynamic registration
- Client doesn't need to know client ID upfront

**Our pattern requires:**
- Client to read `oauthClientId` from config
- ChatGPT doesn't support this metadata field yet

## Recommended Approach for Each Client

### For Cursor ✅ (Current Works)
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

### For Claude Desktop ✅ (Current Should Work)
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

### For ChatGPT ⚠️ (Would Require Gmail Pattern)
```json
{
  "mcpServers": {
    "ownerrez": {
      "command": "node",
      "args": ["/path/to/build/index.js"],
      "env": {
        "OWNERREZ_CLIENT_ID": "c_your_id",
        "OWNERREZ_CLIENT_SECRET": "s_your_secret",
        "OWNERREZ_REDIRECT_URI": "http://localhost:3000/oauth/callback",
        "TRANSPORT_MODE": "stdio"
      }
    }
  }
}
```

But this requires:
1. Each user to create their own OwnerRez OAuth app
2. Running the server locally
3. Much more complex setup

## Conclusion

**Gmail MCP servers work without client ID in the config because:**
- The MCP server itself knows the client ID (passed as environment variable)
- Each user creates and manages their own OAuth app
- The MCP server runs locally on the user's machine

**OwnerRez MCP server requires client ID in the config because:**
- We use a shared OAuth app for all users
- The server is deployed centrally
- The client needs to know which client ID to use

**Both approaches are valid!** The Gmail pattern is more complex setup but more compatible. Our pattern is simpler for users but requires MCP clients to support the `oauthClientId` metadata field.

## Next Steps

### Short Term
- Use Cursor or Claude Desktop (they support `oauthClientId` metadata)
- Document ChatGPT incompatibility

### Long Term Options
1. **Wait for ChatGPT** to add `oauthClientId` metadata support
2. **Switch to Gmail pattern** - require each user to create their own OwnerRez OAuth app
3. **Provide both options** - centralized server OR local server with user's credentials
4. **Implement dynamic registration proxy** - complex but would work with ChatGPT

