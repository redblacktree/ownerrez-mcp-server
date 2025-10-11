import { Router, Request, Response } from 'express';
import { query, transaction } from '../database.js';
import { generateApiKey, hashApiKey, getKeyPrefix } from '../auth.js';

const router = Router();

/**
 * POST /api/users/register
 * Generate a new API key
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    
    // Create user and API key in a transaction
    const result = await transaction(async (client) => {
      // Create user
      const userResult = await client.query<{ id: string }>(
        'INSERT INTO users DEFAULT VALUES RETURNING id'
      );
      const userId = userResult.rows[0].id;
      
      // Generate API key
      const apiKey = generateApiKey();
      const keyHash = await hashApiKey(apiKey);
      const keyPrefix = getKeyPrefix(apiKey);
      
      // Store API key (using client from transaction)
      await client.query(
        `INSERT INTO api_keys (user_id, key_hash, key_prefix, name) 
         VALUES ($1, $2, $3, $4)`,
        [userId, keyHash, keyPrefix, name]
      );
      
      return { userId, apiKey };
    });
    
    res.status(201).json({
      user_id: result.userId,
      api_key: result.apiKey,
      message: 'Store this API key securely. It will not be shown again.'
    });
    
    console.error(`✅ New user registered: ${result.userId}`);
  } catch (error: any) {
    console.error('User registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;

