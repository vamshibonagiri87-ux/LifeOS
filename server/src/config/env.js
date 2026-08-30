import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'lifeos_jwt_super_secret_development_key_32_chars!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  redisUrl: process.env.REDIS_URL || '',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/google/callback',
  },
  ai: {
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },
  // 32-byte key for AES-256-GCM encryption of OAuth tokens
  credentialEncryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY || crypto.createHash('sha256').update('lifeos_default_fallback_encryption_key_do_not_use_in_prod').digest('hex'),
};
