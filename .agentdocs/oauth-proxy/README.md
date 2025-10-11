# OAuth Proxy Documentation

This folder contains documentation for the OAuth proxy implementation that enables per-user OAuth connections.

## Key Documents

### Setup & Implementation
- **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)** - Start here! Complete overview of what was implemented and deployment steps
- **[OAUTH_PROXY_SETUP.md](./OAUTH_PROXY_SETUP.md)** - Detailed setup guide for deploying and using the OAuth proxy

### Understanding the Architecture
- **[OAUTH_ARCHITECTURE_COMPARISON.md](./OAUTH_ARCHITECTURE_COMPARISON.md)** - Explains the difference between shared OAuth vs per-user OAuth proxy patterns
- **[CHATGPT_OAUTH_ISSUE.md](./CHATGPT_OAUTH_ISSUE.md)** - Deep dive into why ChatGPT couldn't connect and how OAuth proxy fixes it

### Testing & Diagnostics
- **[OAUTH_TESTING.md](./OAUTH_TESTING.md)** - Guide for testing OAuth flows with different MCP clients
- **[DIAGNOSTICS.md](./DIAGNOSTICS.md)** - Troubleshooting guide and curl testing examples

## Quick Start

1. Read [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) for the overview
2. Follow the deployment steps in that document
3. Use [OAUTH_PROXY_SETUP.md](./OAUTH_PROXY_SETUP.md) for detailed API reference

## What Problem Does This Solve?

The OAuth proxy allows multiple users to connect their own OwnerRez accounts using API keys instead of requiring each user to:
- Create their own OwnerRez OAuth app
- Run their own MCP server locally
- Know OAuth client credentials

This makes the MCP server work with ChatGPT, Claude Desktop, and Cursor using a simple API key.

