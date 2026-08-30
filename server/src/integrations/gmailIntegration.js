import { BaseIntegration } from './baseIntegration.js';
import { IntegrationService } from '../services/integrationService.js';
import { DataStore } from '../models/dataStore.js';
import { config } from '../config/env.js';
import { AgentOrchestrator } from '../agents/orchestrator.js';
import axios from 'axios';
import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';

/**
 * Utility to extract clean, readable text from email HTML or plain text
 */
function extractCleanText(text, html) {
  if (text && typeof text === 'string' && text.trim().length > 10) {
    return text.trim();
  }
  if (!html || typeof html !== 'string') return text || '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export class GmailIntegration extends BaseIntegration {
  constructor() {
    super('gmail');
  }

  /**
   * Test IMAP connection credentials against Gmail
   */
  static async testImapCredentials(email, appPassword) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = (appPassword || '').replace(/\s+/g, '').trim();

    if (!cleanEmail) throw new Error('Gmail address is required');
    if (!cleanPass) throw new Error('Google App Password is required');

    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: cleanEmail,
        pass: cleanPass,
      },
      logger: false,
      clientInfo: {
        name: 'LifeOS',
        version: '1.0.0',
      },
      socketTimeout: 10000,
    });

    let clientError = null;
    client.on('error', (err) => {
      clientError = err;
    });

    try {
      await client.connect();
      await client.logout();
      return { success: true, email: cleanEmail };
    } catch (err) {
      const activeErr = clientError || err;
      console.error('[GmailIntegration] IMAP verification failed:', activeErr.message);
      let errMsg = 'Failed to connect to Gmail.';
      if (activeErr.message?.includes('AUTHENTICATIONFAILED') || activeErr.message?.includes('Invalid credentials') || activeErr.message?.includes('Command failed')) {
        errMsg = 'Invalid Gmail address or App Password. Please verify your 16-letter App Password at https://myaccount.google.com/apppasswords and ensure 2-Step Verification is enabled.';
      } else if (activeErr.message?.includes('ENOTFOUND') || activeErr.message?.includes('ETIMEDOUT') || activeErr.message?.includes('timeout')) {
        errMsg = 'Network timeout connecting to imap.gmail.com. Please check your internet connection.';
      } else {
        errMsg = `Gmail connection error: ${activeErr.message}`;
      }
      throw new Error(errMsg);
    }
  }

  async getAuthUrl(owner) {
    if (!config.google.clientId) {
      // In development / demo mode, return the callback endpoint with mock code and state
      return `http://localhost:${config.port}/api/integrations/gmail/callback?code=mock_dev_gmail_code_${Date.now()}&state=${encodeURIComponent(JSON.stringify({ owner, provider: 'gmail' }))}`;
    }

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: config.google.redirectUri,
      client_id: config.google.clientId,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
      state: JSON.stringify({ owner, provider: 'gmail' }),
    };

    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  async handleCallback(code, owner) {
    if (!code) throw new Error('Authorization code missing');

    if (!config.google.clientId || !config.google.clientSecret || code.startsWith('mock_')) {
      // Local dev / demo mode connection
      await IntegrationService.saveTokens(owner, 'gmail', {
        accessToken: 'mock_gmail_access_token_' + Date.now(),
        refreshToken: 'mock_gmail_refresh_token_' + Date.now(),
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/userinfo.email'],
        authType: 'dev_simulated',
      });
      return { success: true, message: 'Gmail connected (Dev Mode)' };
    }

    // Live Google token exchange
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const response = await axios.post(tokenUrl, {
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.redirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_in, scope } = response.data;
    let accountEmail = '';
    let accountName = '';
    try {
      const userRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      accountEmail = userRes.data?.email || '';
      accountName = userRes.data?.name || '';
    } catch (uErr) {
      console.warn('[GmailIntegration] Could not fetch Google user profile:', uErr.message);
    }

    await IntegrationService.saveTokens(owner, 'gmail', {
      accessToken: access_token,
      refreshToken: refresh_token || 'gmail_refresh_persisted',
      expiresAt: new Date(Date.now() + (expires_in || 3600) * 1000),
      scopes: scope ? scope.split(' ') : ['https://www.googleapis.com/auth/gmail.readonly'],
      accountEmail,
      accountName,
      authType: 'oauth',
    });

    return { success: true, message: 'Gmail connected successfully via Google OAuth' };
  }

  async connectDirect(owner, { email, appPassword, mode = 'app_password' }) {
    if (!email) throw new Error('Gmail account email is required');
    const cleanEmail = email.toLowerCase().trim();

    if (mode === 'app_password' || appPassword) {
      const cleanPass = (appPassword || '').replace(/\s+/g, '').trim();
      if (!cleanPass) {
        throw new Error('Please enter your 16-character Google App Password.');
      }

      // Verify IMAP connection live
      await GmailIntegration.testImapCredentials(cleanEmail, cleanPass);

      await IntegrationService.saveTokens(owner, 'gmail', {
        accessToken: 'imap_active_' + Date.now(),
        refreshToken: 'imap_refresh_' + Date.now(),
        appPassword: cleanPass,
        accountEmail: cleanEmail,
        accountName: cleanEmail.split('@')[0],
        authType: 'app_password',
        expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      });

      return {
        success: true,
        message: `Successfully verified and connected Gmail for ${cleanEmail}!`,
        accountEmail: cleanEmail,
      };
    }

    // Dev simulated mode
    await IntegrationService.saveTokens(owner, 'gmail', {
      accessToken: 'dev_simulated_token_' + Date.now(),
      refreshToken: 'dev_simulated_refresh_' + Date.now(),
      appPassword: '',
      accountEmail: cleanEmail,
      accountName: cleanEmail.split('@')[0],
      authType: 'dev_simulated',
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    });
    return { success: true, message: `Connected Gmail (Dev Mode) for ${cleanEmail}` };
  }

  async refreshAccessToken(owner, refreshToken) {
    if (!config.google.clientId || !config.google.clientSecret || !refreshToken || refreshToken.startsWith('mock_')) {
      return null;
    }
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });
      const { access_token, expires_in } = response.data;
      if (access_token) {
        await IntegrationService.saveTokens(owner, 'gmail', {
          accessToken: access_token,
          refreshToken,
          expiresAt: new Date(Date.now() + (expires_in || 3600) * 1000),
          scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
          authType: 'oauth',
        });
        return access_token;
      }
    } catch (err) {
      console.error('[GmailIntegration] Token refresh error:', err.response?.data || err.message);
    }
    return null;
  }

  async sync(owner) {
    const integration = await IntegrationService.getIntegration(owner, 'gmail');
    if (!integration || !integration.isConnected) {
      throw new Error('INTEGRATION_NOT_CONNECTED');
    }

    const authType = integration.authType || 'oauth';
    const appPassword = integration.encryptedAppPassword ? IntegrationService.decrypt(integration.encryptedAppPassword) : '';
    let accessToken = integration.encryptedAccessToken ? IntegrationService.decrypt(integration.encryptedAccessToken) : '';
    const refreshToken = integration.encryptedRefreshToken ? IntegrationService.decrypt(integration.encryptedRefreshToken) : '';

    const processedRuns = [];
    const syncedItems = [];

    // ==========================================
    // 1. Live IMAP Fetching (Google App Password)
    // ==========================================
    if (authType === 'app_password' && appPassword && integration.accountEmail) {
      const client = new ImapFlow({
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        auth: {
          user: integration.accountEmail,
          pass: appPassword.replace(/\s+/g, ''),
        },
        logger: false,
        clientInfo: {
          name: 'LifeOS',
          version: '1.0.0',
        },
        socketTimeout: 20000,
      });

      client.on('error', (err) => {
        console.warn('[GmailIntegration] ImapFlow background socket event:', err.message);
      });

      try {
        await client.connect();
        const lock = await client.getMailboxLock('INBOX');
        try {
          const status = await client.status('INBOX', { messages: true });
          const totalMessages = status.messages || 0;
          console.log(`[GmailIntegration] Connected to IMAP for ${integration.accountEmail}. Total inbox messages: ${totalMessages}`);

          if (totalMessages > 0) {
            // Fetch the latest 25 messages
            const fetchCount = Math.min(totalMessages, 25);
            const startSeq = Math.max(1, totalMessages - fetchCount + 1);
            const range = `${startSeq}:${totalMessages}`;

            for await (const message of client.fetch(range, { source: true, envelope: true, uid: true, internalDate: true })) {
              try {
                const uid = message.uid || message.seq;
                const externalId = `gmail-imap-${integration.accountEmail}-${uid}`;

                const existing = await DataStore.sources.findOne({ owner, externalId });
                if (existing) {
                  continue;
                }

                const parsed = await simpleParser(message.source);
                const title = parsed.subject || message.envelope?.subject || 'Incoming Gmail Message';
                const from = parsed.from?.text || message.envelope?.from?.[0]?.address || 'Unknown Sender';
                const date = parsed.date || message.internalDate || new Date();
                const cleanBody = extractCleanText(parsed.text, parsed.html);
                const fullContent = `From: ${from}\nSubject: ${title}\nDate: ${new Date(date).toLocaleString()}\n\n${cleanBody}`;

                const source = await DataStore.sources.create({
                  owner,
                  type: 'EMAIL',
                  externalId,
                  title,
                  content: fullContent,
                  metadata: {
                    from,
                    subject: title,
                    date: new Date(date).toISOString(),
                    messageId: parsed.messageId || '',
                    source: 'gmail_imap',
                  },
                  sourceDate: new Date(date),
                  processingStatus: 'PENDING',
                });

                const runResult = await AgentOrchestrator.processSource(source._id || source.id, owner);
                processedRuns.push(runResult);
                syncedItems.push(title);
              } catch (msgErr) {
                console.warn('[GmailIntegration] Error processing email message:', msgErr.message);
              }
            }
          }
        } finally {
          lock.release();
        }
        await client.logout();
      } catch (imapErr) {
        console.error('[GmailIntegration] IMAP sync error:', imapErr.message);
        throw new Error(`Gmail IMAP Error: ${imapErr.message}`);
      }

      await DataStore.integrations.findByIdAndUpdate(integration._id || integration.id, {
        lastSyncedAt: new Date(),
      });

      return {
        success: true,
        syncedCount: processedRuns.length,
        isLive: true,
        mode: 'imap',
        accountEmail: integration.accountEmail,
        processedRuns,
      };
    }

    // ==========================================
    // 2. Live Google OAuth 2.0 (Gmail REST API)
    // ==========================================
    const isLiveOAuth = accessToken && !accessToken.startsWith('mock_') && !accessToken.startsWith('dev_') && config.google.clientId;
    if (isLiveOAuth) {
      try {
        let gmailRes;
        try {
          gmailRes = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q=label:INBOX', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        } catch (authErr) {
          if (authErr.response?.status === 401 && refreshToken) {
            const newTok = await this.refreshAccessToken(owner, refreshToken);
            if (newTok) {
              accessToken = newTok;
              gmailRes = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q=label:INBOX', {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
            } else {
              throw authErr;
            }
          } else {
            throw authErr;
          }
        }

        const messages = gmailRes?.data?.messages || [];
        for (const msg of messages) {
          const externalId = `gmail-${msg.id}`;
          const existing = await DataStore.sources.findOne({ owner, externalId });
          if (existing) continue;

          const detail = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          const headers = detail.data.payload?.headers || [];
          const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');
          const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
          const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date');

          const title = subjectHeader?.value || 'Incoming Gmail Message';
          const from = fromHeader?.value || 'Unknown Sender';
          const snippet = detail.data.snippet || '';

          let bodyText = '';
          const extractParts = (part) => {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              try {
                bodyText += Buffer.from(part.body.data, 'base64url').toString('utf8') + '\n';
              } catch (e) {}
            } else if (part.mimeType === 'text/html' && part.body?.data && !bodyText) {
              try {
                const htmlStr = Buffer.from(part.body.data, 'base64url').toString('utf8');
                bodyText += extractCleanText('', htmlStr) + '\n';
              } catch (e) {}
            }
            if (part.parts) {
              part.parts.forEach(extractParts);
            }
          };
          if (detail.data.payload) {
            extractParts(detail.data.payload);
          }
          const contentText = bodyText.trim() || snippet || 'No text preview available.';

          const source = await DataStore.sources.create({
            owner,
            type: 'EMAIL',
            externalId,
            title,
            content: `From: ${from}\nSubject: ${title}\nDate: ${dateHeader?.value || new Date().toISOString()}\n\n${contentText}`,
            metadata: { from, subject: title, date: dateHeader?.value || new Date().toISOString(), source: 'gmail_oauth' },
            sourceDate: dateHeader?.value ? new Date(dateHeader.value) : new Date(),
            processingStatus: 'PENDING',
          });

          const runResult = await AgentOrchestrator.processSource(source._id || source.id, owner);
          processedRuns.push(runResult);
          syncedItems.push(title);
        }
      } catch (err) {
        console.error('[GmailIntegration] Live Gmail fetch error:', err.response?.data || err.message);
        throw new Error(`Gmail API error: ${err.response?.data?.error?.message || err.message}`);
      }

      await DataStore.integrations.findByIdAndUpdate(integration._id || integration.id, {
        lastSyncedAt: new Date(),
      });

      return {
        success: true,
        syncedCount: processedRuns.length,
        isLive: true,
        mode: 'oauth',
        accountEmail: integration.accountEmail,
        processedRuns,
      };
    }

    // ==========================================
    // 3. Fallback / Dev Warning
    // ==========================================
    if (authType === 'dev_simulated') {
      throw new Error('Gmail is currently in Dev Simulation mode. Please connect your real Gmail address with an App Password or Google OAuth to sync real emails.');
    }

    throw new Error('No valid Gmail connection credentials found. Please reconnect your Gmail account.');
  }

  async checkStatus(owner) {
    const integration = await IntegrationService.getIntegration(owner, 'gmail');
    return {
      provider: 'gmail',
      isConnected: !!integration?.isConnected,
      accountEmail: integration?.accountEmail || null,
      authType: integration?.authType || null,
      lastSyncedAt: integration?.lastSyncedAt || null,
      expiresAt: integration?.expiresAt || null,
    };
  }

  async disconnect(owner) {
    return await IntegrationService.disconnect(owner, 'gmail');
  }
}
