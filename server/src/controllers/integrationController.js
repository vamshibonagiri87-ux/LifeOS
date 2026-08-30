import { IntegrationService } from '../services/integrationService.js';
import { GmailIntegration } from '../integrations/gmailIntegration.js';
import { CalendarIntegration } from '../integrations/calendarIntegration.js';
import { AIService } from '../services/aiService.js';
import { DataStore } from '../models/dataStore.js';
import { config } from '../config/env.js';

import fs from 'fs';
import path from 'path';

const gmail = new GmailIntegration();
const calendar = new CalendarIntegration();

function renderOAuthHtml({ success, provider, providerTitle, error }) {
  if (success) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Google Sign-In Successful</title>
  <style>
    body {
      background: #0b0f19;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .card {
      background: #1e293b;
      padding: 36px 32px;
      border-radius: 24px;
      border: 1px solid #334155;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      max-width: 360px;
    }
    .check {
      width: 52px;
      height: 52px;
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 26px;
      font-weight: bold;
    }
    h3 { margin: 0 0 8px; font-size: 18px; color: #f8fafc; }
    p { margin: 0; color: #94a3b8; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">✓</div>
    <h3>${providerTitle || 'Google'} Connected!</h3>
    <p>Authentication complete. Returning to LifeOS...</p>
  </div>
  <script>
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', provider: '${provider}' }, '*');
        setTimeout(() => window.close(), 600);
      } else {
        window.location.href = '${config.clientUrl}/integrations?connected=${encodeURIComponent(providerTitle || 'Google')}';
      }
    } catch (e) {
      window.location.href = '${config.clientUrl}/integrations?connected=${encodeURIComponent(providerTitle || 'Google')}';
    }
  </script>
</body>
</html>`;
  } else {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Google Sign-In Failed</title>
  <style>
    body {
      background: #0b0f19;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .card {
      background: #1e293b;
      padding: 36px 32px;
      border-radius: 24px;
      border: 1px solid #334155;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
      max-width: 360px;
    }
    .cross {
      width: 52px;
      height: 52px;
      background: rgba(244, 63, 94, 0.15);
      color: #f43f5e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 26px;
      font-weight: bold;
    }
    h3 { margin: 0 0 8px; font-size: 18px; color: #f43f5e; }
    p { margin: 0; color: #94a3b8; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="cross">✕</div>
    <h3>Authentication Failed</h3>
    <p>${error || 'Unknown error occurred during authentication.'}</p>
  </div>
  <script>
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${encodeURIComponent(error || 'Auth failed')}' }, '*');
        setTimeout(() => window.close(), 1800);
      } else {
        window.location.href = '${config.clientUrl}/integrations?error=${encodeURIComponent(error || 'Auth failed')}';
      }
    } catch (e) {
      window.location.href = '${config.clientUrl}/integrations?error=${encodeURIComponent(error || 'Auth failed')}';
    }
  </script>
</body>
</html>`;
  }
}

export class IntegrationController {
  static async getStatus(req, res, next) {
    try {
      const integrations = await IntegrationService.getAllIntegrationsStatus(req.user.id);
      res.status(200).json({
        success: true,
        data: {
          integrations,
          hasGoogleConfig: !!(config.google.clientId && config.google.clientSecret),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async saveGoogleConfig(req, res, next) {
    try {
      const { clientId, clientSecret, redirectUri } = req.body;
      if (!clientId || !clientSecret) {
        return res.status(400).json({ success: false, error: { message: 'Client ID and Client Secret are required' } });
      }

      config.google.clientId = clientId.trim();
      config.google.clientSecret = clientSecret.trim();
      if (redirectUri) {
        config.google.redirectUri = redirectUri.trim();
      }

      // Update .env file on disk
      try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          if (envContent.includes('GOOGLE_CLIENT_ID=')) {
            envContent = envContent.replace(/^GOOGLE_CLIENT_ID=.*$/m, `GOOGLE_CLIENT_ID=${config.google.clientId}`);
          } else {
            envContent += `\nGOOGLE_CLIENT_ID=${config.google.clientId}`;
          }
          if (envContent.includes('GOOGLE_CLIENT_SECRET=')) {
            envContent = envContent.replace(/^GOOGLE_CLIENT_SECRET=.*$/m, `GOOGLE_CLIENT_SECRET=${config.google.clientSecret}`);
          } else {
            envContent += `\nGOOGLE_CLIENT_SECRET=${config.google.clientSecret}`;
          }
          if (redirectUri) {
            if (envContent.includes('GOOGLE_REDIRECT_URI=')) {
              envContent = envContent.replace(/^GOOGLE_REDIRECT_URI=.*$/m, `GOOGLE_REDIRECT_URI=${config.google.redirectUri}`);
            } else {
              envContent += `\nGOOGLE_REDIRECT_URI=${config.google.redirectUri}`;
            }
          }
          fs.writeFileSync(envPath, envContent, 'utf8');
        }
      } catch (fileErr) {
        console.warn('Could not write .env file directly:', fileErr.message);
      }

      res.status(200).json({
        success: true,
        message: 'Google OAuth credentials saved successfully',
        data: {
          hasGoogleConfig: true,
          clientIdPrefix: config.google.clientId ? `${config.google.clientId.substring(0, 15)}...` : '',
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async startGmailOAuth(req, res, next) {
    try {
      const mode = req.query.mode;
      const authUrl = await gmail.getAuthUrl(req.user.id, mode);
      res.status(200).json({
        success: true,
        data: {
          authUrl,
          hasGoogleConfig: !!(config.google.clientId && config.google.clientSecret),
          isGoogleDirect: authUrl.startsWith('https://accounts.google.com'),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async handleGmailCallback(req, res, next) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.send(renderOAuthHtml({ success: false, provider: 'gmail', error }));
      }

      if (!code) {
        return res.send(renderOAuthHtml({ success: false, provider: 'gmail', error: 'No authorization code provided' }));
      }

      let ownerId = req.user?.id;
      if (!ownerId && state) {
        try {
          const parsed = typeof state === 'string' ? JSON.parse(state) : state;
          ownerId = parsed.owner || parsed.userId || parsed.id;
        } catch (e) {
          console.error('[handleGmailCallback] Error parsing OAuth state:', e);
        }
      }

      if (!ownerId) {
        return res.send(renderOAuthHtml({ success: false, provider: 'gmail', error: 'Missing user session state' }));
      }

      await gmail.handleCallback(code, ownerId);
      return res.send(renderOAuthHtml({ success: true, provider: 'gmail', providerTitle: 'Gmail' }));
    } catch (err) {
      console.error('[handleGmailCallback] Error:', err);
      return res.send(renderOAuthHtml({ success: false, provider: 'gmail', error: err.message || 'OAuth authentication failed' }));
    }
  }

  static async syncGmail(req, res, next) {
    try {
      const result = await gmail.sync(req.user.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getGmailStatus(req, res, next) {
    try {
      const status = await gmail.checkStatus(req.user.id);
      res.status(200).json({ success: true, data: { status } });
    } catch (err) {
      next(err);
    }
  }

  static async disconnectGmail(req, res, next) {
    try {
      await gmail.disconnect(req.user.id);
      res.status(200).json({ success: true, message: 'Gmail disconnected' });
    } catch (err) {
      next(err);
    }
  }

  static async startCalendarOAuth(req, res, next) {
    try {
      const mode = req.query.mode;
      const authUrl = await calendar.getAuthUrl(req.user.id, mode);
      res.status(200).json({
        success: true,
        data: {
          authUrl,
          hasGoogleConfig: !!(config.google.clientId && config.google.clientSecret),
          isGoogleDirect: authUrl.startsWith('https://accounts.google.com'),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async handleCalendarCallback(req, res, next) {
    try {
      const { code, state, error } = req.query;

      if (error) {
        return res.send(renderOAuthHtml({ success: false, provider: 'google-calendar', error }));
      }

      if (!code) {
        return res.send(renderOAuthHtml({ success: false, provider: 'google-calendar', error: 'No authorization code provided' }));
      }

      let ownerId = req.user?.id;
      if (!ownerId && state) {
        try {
          const parsed = typeof state === 'string' ? JSON.parse(state) : state;
          ownerId = parsed.owner || parsed.userId || parsed.id;
        } catch (e) {
          console.error('[handleCalendarCallback] Error parsing OAuth state:', e);
        }
      }

      if (!ownerId) {
        return res.send(renderOAuthHtml({ success: false, provider: 'google-calendar', error: 'Missing user session state' }));
      }

      await calendar.handleCallback(code, ownerId);
      return res.send(renderOAuthHtml({ success: true, provider: 'google-calendar', providerTitle: 'Google Calendar' }));
    } catch (err) {
      console.error('[handleCalendarCallback] Error:', err);
      return res.send(renderOAuthHtml({ success: false, provider: 'google-calendar', error: err.message || 'OAuth authentication failed' }));
    }
  }

  static async syncCalendar(req, res, next) {
    try {
      const result = await calendar.sync(req.user.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getCalendarStatus(req, res, next) {
    try {
      const status = await calendar.checkStatus(req.user.id);
      res.status(200).json({ success: true, data: { status } });
    } catch (err) {
      next(err);
    }
  }

  static async disconnectCalendar(req, res, next) {
    try {
      await calendar.disconnect(req.user.id);
      res.status(200).json({ success: true, message: 'Calendar disconnected' });
    } catch (err) {
      next(err);
    }
  }

  static async handleGeneralOAuthStart(req, res, next) {
    const { provider } = req.params;
    if (provider === 'gmail') return this.startGmailOAuth(req, res, next);
    if (provider === 'google-calendar' || provider === 'calendar') return this.startCalendarOAuth(req, res, next);
    res.status(400).json({ success: false, error: { message: `Unknown provider: ${provider}` } });
  }

  static async handleGeneralOAuthCallback(req, res, next) {
    let { provider } = req.params;

    // Detect provider from state if general google callback
    if (provider === 'google' || provider === 'all') {
      if (req.query.state) {
        try {
          const parsed = typeof req.query.state === 'string' ? JSON.parse(req.query.state) : req.query.state;
          if (parsed.provider) {
            provider = parsed.provider;
          }
        } catch (e) {
          console.error('[handleGeneralOAuthCallback] Error parsing state:', e);
        }
      }
    }

    if (provider === 'gmail') return this.handleGmailCallback(req, res, next);
    if (provider === 'google-calendar' || provider === 'calendar') return this.handleCalendarCallback(req, res, next);
    res.redirect(`${config.clientUrl}/integrations?error=unknown_provider`);
  }

  static async connectDirect(req, res, next) {
    try {
      const { provider } = req.params;
      const { email, password, appPassword, mode } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: { message: 'Google email address is required' } });
      }

      let result;
      if (provider === 'google-calendar' || provider === 'calendar') {
        result = await calendar.connectDirect(req.user.id, {
          email,
          appPassword: appPassword || password,
          mode,
        });
      } else if (provider === 'gmail') {
        result = await gmail.connectDirect(req.user.id, {
          email,
          appPassword: appPassword || password,
          mode,
        });
      } else {
        return res.status(400).json({ success: false, error: { message: `Unsupported provider: ${provider}` } });
      }

      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async testCredentials(req, res, next) {
    try {
      const { provider, email, appPassword } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, error: { message: 'Email address is required' } });
      }
      if (provider === 'gmail') {
        if (!appPassword) {
          return res.status(400).json({ success: false, error: { message: 'Google App Password is required' } });
        }
        await GmailIntegration.testImapCredentials(email, appPassword);
        return res.status(200).json({
          success: true,
          message: 'Gmail connection verified successfully! Credentials are valid.',
        });
      }
      res.status(400).json({ success: false, error: { message: `Testing not supported for ${provider}` } });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || 'Credential verification failed.' } });
    }
  }

  static async purgeDemoData(req, res, next) {
    try {
      const owner = req.user.id;
      const { purgeAll } = req.body || {};

      let deletedResponsibilities = 0;
      let deletedSources = 0;

      if (purgeAll) {
        const rResult = await DataStore.responsibilities.deleteMany({ owner });
        const sResult = await DataStore.sources.deleteMany({ owner });
        await DataStore.processingRuns.deleteMany({ owner });
        deletedResponsibilities = rResult?.deletedCount || 0;
        deletedSources = sResult?.deletedCount || 0;
      } else {
        // Purge demo sources
        const allSources = await DataStore.sources.find({ owner });
        const demoSourceIds = [];
        for (const s of allSources) {
          const extId = s.externalId || '';
          if (
            extId.startsWith('gmail-msg-') ||
            extId.startsWith('cal-evt-') ||
            extId.includes('mock') ||
            extId.includes('dev') ||
            s.title?.includes('Doctor Appointment') ||
            s.title?.includes('Electricity Utility') ||
            s.title?.includes('Advanced AI Systems')
          ) {
            demoSourceIds.push(s._id || s.id);
            await DataStore.sources.findByIdAndDelete(s._id || s.id);
            deletedSources++;
          }
        }

        // Purge responsibilities tied to demo items
        const allResp = await DataStore.responsibilities.find({ owner });
        for (const r of allResp) {
          const linkedSources = r.sourceIds || [];
          const isLinkedToDemo = linkedSources.some(sid => demoSourceIds.includes(sid));
          const title = r.title || '';
          const isDemoTitle =
            title.includes('Health Checkup') ||
            title.includes('Electricity Utility') ||
            title.includes('Senior AI Engineer') ||
            title.includes('Advanced AI Systems') ||
            title.includes('Health Insurance Card') ||
            title.includes('Prerequisites to prepare:');

          if (isLinkedToDemo || isDemoTitle) {
            await DataStore.responsibilities.findByIdAndDelete(r._id || r.id);
            deletedResponsibilities++;
          }
        }
      }

      res.status(200).json({
        success: true,
        message: purgeAll
          ? `All obligations wiped (${deletedResponsibilities} obligations, ${deletedSources} sources). Ready for clean real sync!`
          : `Purged ${deletedResponsibilities} fake demo obligations and ${deletedSources} mock sources!`,
        data: {
          deletedResponsibilities,
          deletedSources,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async saveAIConfig(req, res, next) {
    try {
      const { geminiApiKey, openRouterApiKey } = req.body;

      if (geminiApiKey !== undefined) {
        config.ai.geminiApiKey = geminiApiKey.trim();
      }
      if (openRouterApiKey !== undefined) {
        config.ai.openRouterApiKey = openRouterApiKey.trim();
      }

      // Persist to .env file
      try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, 'utf8');
          if (geminiApiKey !== undefined) {
            if (envContent.includes('GEMINI_API_KEY=')) {
              envContent = envContent.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${config.ai.geminiApiKey}`);
            } else {
              envContent += `\nGEMINI_API_KEY=${config.ai.geminiApiKey}`;
            }
          }
          if (openRouterApiKey !== undefined) {
            if (envContent.includes('OPENROUTER_API_KEY=')) {
              envContent = envContent.replace(/^OPENROUTER_API_KEY=.*$/m, `OPENROUTER_API_KEY=${config.ai.openRouterApiKey}`);
            } else {
              envContent += `\nOPENROUTER_API_KEY=${config.ai.openRouterApiKey}`;
            }
          }
          fs.writeFileSync(envPath, envContent, 'utf8');
        }
      } catch (fileErr) {
        console.warn('Could not write AI keys to .env:', fileErr.message);
      }

      res.status(200).json({
        success: true,
        message: 'AI Provider configuration updated successfully!',
        data: {
          hasGemini: !!config.ai.geminiApiKey,
          hasOpenRouter: !!config.ai.openRouterApiKey,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async testAIKey(req, res, next) {
    try {
      const { provider, apiKey } = req.body;
      const result = await AIService.testApiKey(provider, apiKey);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      res.status(400).json({ success: false, error: { message: err.message || 'AI Key validation failed.' } });
    }
  }

  static async oauthError(req, res) {
    res.status(400).json({ success: false, error: { code: 'OAUTH_ERROR', message: 'OAuth Authentication Failed' } });
  }
}
