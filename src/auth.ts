import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { query } from './database.js';

const SALT_ROUNDS = 10;
const API_KEY_PREFIX = 'ownerrez_sk_';
const API_KEY_LENGTH = 48; // Length of the random part

/**
 * Generate a new API key
 * Format: ownerrez_sk_<48-random-chars>
 */
export function generateApiKey(): string {
  const randomPart = crypto.randomBytes(API_KEY_LENGTH / 2).toString('hex');
  return `${API_KEY_PREFIX}${randomPart}`;
}

/**
 * Hash an API key for storage
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, SALT_ROUNDS);
}

/**
 * Verify an API key against its hash
 */
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}

/**
 * Get key prefix for display (first 16 chars)
 */
export function getKeyPrefix(apiKey: string): string {
  return apiKey.substring(0, 16) + '...';
}

/**
 * Store a new API key in the database
 */
export async function storeApiKey(userId: string, apiKey: string, name?: string): Promise<void> {
  const keyHash = await hashApiKey(apiKey);
  const keyPrefix = getKeyPrefix(apiKey);
  
  await query(
    `INSERT INTO api_keys (user_id, key_hash, key_prefix, name) 
     VALUES ($1, $2, $3, $4)`,
    [userId, keyHash, keyPrefix, name]
  );
}

/**
 * Validate API key and return user ID
 */
export async function validateApiKey(apiKey: string): Promise<string | null> {
  if (!apiKey || !apiKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  // Get all API keys (we need to check each hash)
  const result = await query<{ id: string; user_id: string; key_hash: string }>(
    'SELECT id, user_id, key_hash FROM api_keys'
  );

  for (const row of result.rows) {
    if (await verifyApiKey(apiKey, row.key_hash)) {
      // Update last_used_at
      await query(
        'UPDATE api_keys SET last_used_at = NOW() WHERE id = $1',
        [row.id]
      );
      return row.user_id;
    }
  }

  return null;
}

/**
 * Express middleware to require API key authentication
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer '
  
  validateApiKey(apiKey)
    .then(userId => {
      if (!userId) {
        res.status(401).json({ error: 'Invalid API key' });
        return;
      }
      
      // Attach userId to request for use in handlers
      (req as any).userId = userId;
      next();
    })
    .catch(error => {
      console.error('API key validation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    });
}

/**
 * Generate a random state for OAuth flow
 */
export function generateOAuthState(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Store OAuth state in database
 */
export async function storeOAuthState(state: string, userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  await query(
    'INSERT INTO oauth_states (state, user_id, expires_at) VALUES ($1, $2, $3)',
    [state, userId, expiresAt]
  );
}

/**
 * Validate and consume OAuth state
 */
export async function validateOAuthState(state: string): Promise<string | null> {
  const result = await query<{ user_id: string; expires_at: Date }>(
    'SELECT user_id, expires_at FROM oauth_states WHERE state = $1',
    [state]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const { user_id, expires_at } = result.rows[0];
  
  // Check if expired
  if (new Date() > new Date(expires_at)) {
    // Clean up expired state
    await query('DELETE FROM oauth_states WHERE state = $1', [state]);
    return null;
  }

  // Delete state (one-time use)
  await query('DELETE FROM oauth_states WHERE state = $1', [state]);
  
  return user_id;
}

/**
 * Clean up expired OAuth states (call periodically)
 */
export async function cleanupExpiredStates(): Promise<void> {
  await query('DELETE FROM oauth_states WHERE expires_at < NOW()');
}

/**
 * Encryption/Decryption for tokens
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  // Derive a 32-byte key from the environment variable
  return crypto.pbkdf2Sync(key, 'salt', 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt a token for storage
 */
export function encryptToken(token: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Format: iv:encrypted:tag (all in hex)
  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

/**
 * Decrypt a token from storage
 */
export function decryptToken(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const tag = Buffer.from(parts[2], 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

