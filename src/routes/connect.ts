import { Router, Request, Response } from 'express';
import { query } from '../database.js';
import { 
  requireApiKey, 
  generateOAuthState, 
  storeOAuthState, 
  validateOAuthState,
  encryptToken,
  decryptToken
} from '../auth.js';
import { OwnerRezClient } from '../client.js';

const router = Router();

// Get base URL from SERVER_URL environment variable
const getProxyRedirectUri = (): string => {
  const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
  return `${serverUrl}/api/connect/ownerrez/callback`;
};

// Initialize OwnerRez client for OAuth proxy operations
const oauthClient = new OwnerRezClient({
  clientId: process.env.OWNERREZ_CLIENT_ID || '',
  clientSecret: process.env.OWNERREZ_CLIENT_SECRET || '',
  redirectUri: getProxyRedirectUri(),
});

/**
 * GET /api/connect/ownerrez/start
 * Get OwnerRez authorization URL
 */
router.get('/ownerrez/start', requireApiKey, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    // Check if already connected
    const existing = await query(
      'SELECT id FROM ownerrez_connections WHERE user_id = $1',
      [userId]
    );
    
    if (existing.rows.length > 0) {
      res.status(400).json({ 
        error: 'OwnerRez account already connected',
        message: 'Revoke existing connection first'
      });
      return;
    }
    
    // Generate OAuth state
    const state = generateOAuthState();
    await storeOAuthState(state, userId);
    
    // Get authorization URL
    const authorizationUrl = oauthClient.getAuthorizationUrl(state);
    
    res.json({
      authorization_url: authorizationUrl,
      state: state,
      message: 'Visit this URL to authorize OwnerRez'
    });
  } catch (error: any) {
    console.error('OAuth start error:', error);
    res.status(500).json({ error: 'Failed to start OAuth flow' });
  }
});

/**
 * GET /api/connect/ownerrez/callback
 * OAuth callback from OwnerRez
 */
router.get('/ownerrez/callback', async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;
    
    // Handle OAuth error
    if (error) {
      res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Error</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .error { background: #fee; border: 1px solid #c33; padding: 20px; border-radius: 8px; }
              h1 { color: #c33; }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>❌ Authorization Failed</h1>
              <p><strong>Error:</strong> ${error}</p>
              <p><strong>Description:</strong> ${error_description || 'No description provided'}</p>
            </div>
          </body>
        </html>
      `);
      return;
    }
    
    if (!code || typeof code !== 'string' || !state || typeof state !== 'string') {
      res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Error</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .error { background: #fee; border: 1px solid #c33; padding: 20px; border-radius: 8px; }
              h1 { color: #c33; }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>❌ Invalid Request</h1>
              <p>Missing authorization code or state parameter.</p>
            </div>
          </body>
        </html>
      `);
      return;
    }
    
    // Validate state
    const userId = await validateOAuthState(state);
    if (!userId) {
      res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>OAuth Error</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
              .error { background: #fee; border: 1px solid #c33; padding: 20px; border-radius: 8px; }
              h1 { color: #c33; }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>❌ Invalid State</h1>
              <p>OAuth state validation failed. The authorization link may have expired or been used already.</p>
              <p>Please start the authorization process again.</p>
            </div>
          </body>
        </html>
      `);
      return;
    }
    
    // Exchange code for token
    const tokenResponse = await oauthClient.exchangeCodeForToken(code);
    
    // Encrypt and store token
    const encryptedAccessToken = encryptToken(tokenResponse.access_token);
    const encryptedRefreshToken = tokenResponse.refresh_token 
      ? encryptToken(tokenResponse.refresh_token) 
      : null;
    
    await query(
      `INSERT INTO ownerrez_connections 
       (user_id, access_token, refresh_token, user_id_ownerrez) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         access_token = $2,
         refresh_token = $3,
         user_id_ownerrez = $4,
         updated_at = NOW()`,
      [userId, encryptedAccessToken, encryptedRefreshToken, tokenResponse.user_id]
    );
    
    console.error(`✅ OwnerRez connected for user ${userId}`);
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Successful</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .success { background: #efe; border: 1px solid #3c3; padding: 20px; border-radius: 8px; }
            h1 { color: #3c3; }
            code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="success">
            <h1>✅ Authorization Successful!</h1>
            <p>Your OwnerRez account has been connected successfully.</p>
            <p><strong>OwnerRez User ID:</strong> <code>${tokenResponse.user_id}</code></p>
            <h3>Next Steps:</h3>
            <ol>
              <li>Configure your MCP client with your API key</li>
              <li>Start using OwnerRez tools in Claude Desktop, Cursor, or ChatGPT!</li>
            </ol>
            <p>You can close this window now.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OAuth Error</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .error { background: #fee; border: 1px solid #c33; padding: 20px; border-radius: 8px; }
            h1 { color: #c33; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>❌ Token Exchange Failed</h1>
            <p><strong>Error:</strong> ${error.message}</p>
            <p>Please try the authorization process again.</p>
          </div>
        </body>
      </html>
    `);
  }
});

/**
 * GET /api/connect/ownerrez/status
 * Check OwnerRez connection status
 */
router.get('/ownerrez/status', requireApiKey, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const result = await query<{
      user_id_ownerrez: number;
      created_at: Date;
      expires_at: Date | null;
    }>(
      'SELECT user_id_ownerrez, created_at, expires_at FROM ownerrez_connections WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      res.json({
        connected: false,
        message: 'No OwnerRez account connected'
      });
      return;
    }
    
    const connection = result.rows[0];
    
    res.json({
      connected: true,
      ownerrez_user_id: connection.user_id_ownerrez,
      connected_at: connection.created_at,
      expires_at: connection.expires_at
    });
  } catch (error: any) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});

/**
 * DELETE /api/connect/ownerrez
 * Revoke OwnerRez connection
 */
router.delete('/ownerrez', requireApiKey, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    
    const result = await query(
      'DELETE FROM ownerrez_connections WHERE user_id = $1 RETURNING id',
      [userId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'No OwnerRez connection found' });
      return;
    }
    
    console.error(`✅ OwnerRez connection revoked for user ${userId}`);
    
    res.json({ message: 'OwnerRez connection revoked successfully' });
  } catch (error: any) {
    console.error('Revocation error:', error);
    res.status(500).json({ error: 'Failed to revoke connection' });
  }
});

/**
 * Helper function to get user's OwnerRez token
 * Used by MCP server to make API calls on behalf of user
 */
export async function getUserOwnerRezToken(userId: string): Promise<string | null> {
  try {
    const result = await query<{ access_token: string }>(
      'SELECT access_token FROM ownerrez_connections WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // Decrypt token
    return decryptToken(result.rows[0].access_token);
  } catch (error) {
    console.error('Error retrieving user token:', error);
    return null;
  }
}

export default router;

