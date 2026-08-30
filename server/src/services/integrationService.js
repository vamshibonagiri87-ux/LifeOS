import crypto from 'crypto';
import { DataStore } from '../models/dataStore.js';
import { config } from '../config/env.js';
import { AppError } from '../middleware/errorMiddleware.js';

export class IntegrationService {
  /**
   * AES-256-GCM encryption for sensitive OAuth tokens
   */
  static encrypt(text) {
    if (!text) return '';
    try {
      const iv = crypto.randomBytes(12);
      const key = Buffer.from(config.credentialEncryptionKey.padEnd(32, '0').slice(0, 32));
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (err) {
      console.error('[IntegrationService] Encryption error:', err);
      return text;
    }
  }

  /**
   * AES-256-GCM decryption
   */
  static decrypt(cipherText) {
    if (!cipherText || !cipherText.includes(':')) return cipherText;
    try {
      const [ivHex, authTagHex, encrypted] = cipherText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const key = Buffer.from(config.credentialEncryptionKey.padEnd(32, '0').slice(0, 32));
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      console.error('[IntegrationService] Decryption error:', err);
      return '';
    }
  }

  static async getIntegration(owner, provider) {
    return await DataStore.integrations.findOne({ owner, provider });
  }

  static async saveTokens(owner, provider, { accessToken, refreshToken, expiresAt, scopes = [], accountEmail, accountName, authType = 'oauth', appPassword }) {
    const encryptedAccess = accessToken ? this.encrypt(accessToken) : '';
    const encryptedRefresh = refreshToken ? this.encrypt(refreshToken) : '';
    const encryptedAppPass = appPassword ? this.encrypt(appPassword) : '';

    const existing = await DataStore.integrations.findOne({ owner, provider });
    if (existing) {
      return await DataStore.integrations.findByIdAndUpdate(existing._id || existing.id, {
        isConnected: true,
        accountEmail: accountEmail || existing.accountEmail || '',
        accountName: accountName || existing.accountName || '',
        authType: authType || existing.authType || 'oauth',
        encryptedAccessToken: encryptedAccess || existing.encryptedAccessToken,
        encryptedRefreshToken: encryptedRefresh || existing.encryptedRefreshToken,
        encryptedAppPassword: encryptedAppPass || existing.encryptedAppPassword,
        expiresAt: expiresAt || new Date(Date.now() + 3600 * 1000),
        scopes,
        lastSyncedAt: new Date(),
      });
    }

    return await DataStore.integrations.create({
      owner,
      provider,
      isConnected: true,
      accountEmail: accountEmail || '',
      accountName: accountName || '',
      authType: authType || 'oauth',
      encryptedAccessToken: encryptedAccess,
      encryptedRefreshToken: encryptedRefresh,
      encryptedAppPassword: encryptedAppPass,
      expiresAt: expiresAt || new Date(Date.now() + 3600 * 1000),
      scopes,
      lastSyncedAt: new Date(),
    });
  }

  static async disconnect(owner, provider) {
    const existing = await DataStore.integrations.findOne({ owner, provider });
    if (existing) {
      return await DataStore.integrations.findByIdAndUpdate(existing._id || existing.id, {
        isConnected: false,
        accountEmail: '',
        accountName: '',
        encryptedAccessToken: '',
        encryptedRefreshToken: '',
        encryptedAppPassword: '',
        expiresAt: null,
      });
    }
    return { success: true };
  }

  static async getAllIntegrationsStatus(owner) {
    const providers = ['gmail', 'google-calendar', 'openrouter', 'gemini'];
    const results = {};

    for (const provider of providers) {
      const record = await DataStore.integrations.findOne({ owner, provider });
      const hasKey = provider === 'openrouter' ? !!config.ai.openRouterApiKey : provider === 'gemini' ? !!config.ai.geminiApiKey : false;
      const decryptedToken = record?.encryptedAccessToken ? this.decrypt(record.encryptedAccessToken) : '';
      const isLive = !!(record?.isConnected && ((decryptedToken && !decryptedToken.startsWith('mock_') && config.google.clientId) || record?.authType === 'app_password'));

      results[provider] = {
        provider,
        isConnected: record ? record.isConnected : (hasKey ? true : false),
        isLive,
        accountEmail: record?.accountEmail || null,
        accountName: record?.accountName || null,
        authType: record?.authType || (isLive ? 'oauth' : 'dev_simulated'),
        hasGoogleConfig: !!(config.google.clientId && config.google.clientSecret),
        expiresAt: record?.expiresAt || null,
        lastSyncedAt: record?.lastSyncedAt || null,
        scopes: record?.scopes || [],
      };
    }
    return results;
  }
}
