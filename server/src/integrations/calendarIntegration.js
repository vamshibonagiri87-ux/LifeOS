import { BaseIntegration } from './baseIntegration.js';
import { IntegrationService } from '../services/integrationService.js';
import { DataStore } from '../models/dataStore.js';
import { config } from '../config/env.js';
import { AgentOrchestrator } from '../agents/orchestrator.js';
import axios from 'axios';

export class CalendarIntegration extends BaseIntegration {
  constructor() {
    super('google-calendar');
  }

  async getAuthUrl(owner) {
    if (!config.google.clientId) {
      // In development / demo mode, return the callback endpoint with mock code and state
      return `http://localhost:${config.port}/api/integrations/calendar/callback?code=mock_dev_cal_code_${Date.now()}&state=${encodeURIComponent(JSON.stringify({ owner, provider: 'google-calendar' }))}`;
    }

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options = {
      redirect_uri: config.google.redirectUri,
      client_id: config.google.clientId,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
      state: JSON.stringify({ owner, provider: 'google-calendar' }),
    };

    const qs = new URLSearchParams(options);
    return `${rootUrl}?${qs.toString()}`;
  }

  async handleCallback(code, owner) {
    if (!code) throw new Error('Authorization code missing');

    if (!config.google.clientId || !config.google.clientSecret || code.startsWith('mock_')) {
      // Local dev / demo mode connection
      await IntegrationService.saveTokens(owner, 'google-calendar', {
        accessToken: 'mock_calendar_access_token_' + Date.now(),
        refreshToken: 'mock_calendar_refresh_token_' + Date.now(),
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        scopes: ['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/userinfo.email'],
      });
      return { success: true, message: 'Google Calendar connected successfully (Dev Mode)' };
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
      console.warn('[CalendarIntegration] Could not fetch Google user profile:', uErr.message);
    }

    await IntegrationService.saveTokens(owner, 'google-calendar', {
      accessToken: access_token,
      refreshToken: refresh_token || 'cal_refresh_persisted',
      expiresAt: new Date(Date.now() + (expires_in || 3600) * 1000),
      scopes: scope ? scope.split(' ') : ['https://www.googleapis.com/auth/calendar.readonly'],
      accountEmail,
      accountName,
      authType: 'oauth',
    });

    return { success: true, message: 'Google Calendar connected successfully' };
  }

  async connectDirect(owner, { email, appPassword, mode = 'app_password' }) {
    if (!email) throw new Error('Google account email is required');
    const cleanEmail = email.toLowerCase().trim();
    await IntegrationService.saveTokens(owner, 'google-calendar', {
      accessToken: 'direct_cal_token_' + Date.now(),
      refreshToken: 'direct_cal_refresh_' + Date.now(),
      appPassword: appPassword || '',
      accountEmail: cleanEmail,
      accountName: cleanEmail.split('@')[0],
      authType: mode === 'dev' ? 'dev_simulated' : 'app_password',
      expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
    });
    return { success: true, message: `Connected Google Calendar for ${cleanEmail}` };
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
        await IntegrationService.saveTokens(owner, 'google-calendar', {
          accessToken: access_token,
          refreshToken,
          expiresAt: new Date(Date.now() + (expires_in || 3600) * 1000),
          scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        });
        return access_token;
      }
    } catch (err) {
      console.error('[CalendarIntegration] Token refresh error:', err.response?.data || err.message);
    }
    return null;
  }

  async sync(owner) {
    const integration = await IntegrationService.getIntegration(owner, 'google-calendar');
    if (!integration || !integration.isConnected) {
      throw new Error('INTEGRATION_NOT_CONNECTED');
    }

    let accessToken = IntegrationService.decrypt(integration.encryptedAccessToken);
    const refreshToken = IntegrationService.decrypt(integration.encryptedRefreshToken);

    const isLiveToken = accessToken && !accessToken.startsWith('mock_') && config.google.clientId;
    const processedRuns = [];
    let syncedItems = [];

    if (isLiveToken) {
      try {
        // Look from 30 days in the past to 90 days in the future
        const timeMin = new Date(Date.now() - 30 * 86400000).toISOString();
        const timeMax = new Date(Date.now() + 90 * 86400000).toISOString();
        let calRes;
        try {
          calRes = await axios.get(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=50&singleEvents=true&orderBy=startTime`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
        } catch (authErr) {
          if (authErr.response?.status === 401 && refreshToken) {
            const newTok = await this.refreshAccessToken(owner, refreshToken);
            if (newTok) {
              accessToken = newTok;
              calRes = await axios.get(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=50&singleEvents=true&orderBy=startTime`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
            } else {
              throw authErr;
            }
          } else {
            throw authErr;
          }
        }

        const events = calRes?.data?.items || [];
        for (const evt of events) {
          if (!evt.summary && !evt.description) continue;

          const existing = await DataStore.sources.findOne({ owner, externalId: `cal-${evt.id}` });
          if (existing) continue;

          const title = evt.summary || 'Scheduled Calendar Event';
          const description = evt.description || '';
          const eventDateStr = evt.start?.dateTime || evt.start?.date || new Date().toISOString();
          const location = evt.location || '';
          const attendeesList = evt.attendees ? evt.attendees.map(a => a.displayName || a.email).join(', ') : '';

          const content = `Calendar Event: ${title}\nDate: ${eventDateStr}\nLocation: ${location || 'N/A'}\nAttendees: ${attendeesList || 'N/A'}\nDetails: ${description || 'No additional description provided.'}`;

          const source = await DataStore.sources.create({
            owner,
            type: 'CALENDAR_EVENT',
            externalId: `cal-${evt.id}`,
            title,
            content,
            metadata: { eventDate: eventDateStr, location, summary: title, attendees: attendeesList },
            sourceDate: new Date(eventDateStr),
            processingStatus: 'PENDING',
          });

          const runResult = await AgentOrchestrator.processSource(source._id || source.id, owner);
          processedRuns.push(runResult);
          syncedItems.push(title);
        }
      } catch (err) {
        console.error('[CalendarIntegration] Live Calendar fetch error:', err.response?.data || err.message);
        throw new Error(`Google Calendar API error: ${err.response?.data?.error?.message || err.message}`);
      }
    } else {
      // In Dev / Simulation Mode ONLY: ingest realistic simulated calendar obligations
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + 3);
      appointmentDate.setHours(14, 0, 0, 0);

      const examDate = new Date();
      examDate.setDate(examDate.getDate() + 5);
      examDate.setHours(9, 30, 0, 0);

      const sampleEvents = [
        {
          title: 'Doctor Appointment — Comprehensive Health Checkup',
          content: `Annual Health Checkup appointment with Dr. Sarah Smith at City Clinic on ${appointmentDate.toLocaleDateString()} at 2:00 PM.\nPrerequisites:\n1. Bring previous laboratory blood work and diagnostic reports.\n2. Bring valid Health Insurance Card and Photo Identification.`,
          externalId: `cal-evt-${Date.now()}-1`,
          date: appointmentDate,
          location: 'City Medical Health Center, Suite 400',
        },
        {
          title: 'Advanced AI Systems Final Examination',
          content: `Final Examination for Advanced AI Systems scheduled on ${examDate.toLocaleDateString()} at 9:30 AM in Hall B.\nRequirements:\n1. Bring Student Identification Card.\n2. Bring approved calculator and examination hall ticket.`,
          externalId: `cal-evt-${Date.now()}-2`,
          date: examDate,
          location: 'University Campus, Hall B',
        },
      ];

      for (const evt of sampleEvents) {
        const source = await DataStore.sources.create({
          owner,
          type: 'CALENDAR_EVENT',
          externalId: evt.externalId,
          title: evt.title,
          content: evt.content,
          metadata: { eventDate: evt.date.toISOString(), location: evt.location },
          sourceDate: evt.date,
          processingStatus: 'PENDING',
        });

        const runResult = await AgentOrchestrator.processSource(source._id || source.id, owner);
        processedRuns.push(runResult);
      }
    }

    await DataStore.integrations.findByIdAndUpdate(integration._id || integration.id, {
      lastSyncedAt: new Date(),
    });

    return {
      success: true,
      syncedCount: processedRuns.length,
      isLive: isLiveToken,
      processedRuns,
    };
  }

  async checkStatus(owner) {
    const integration = await IntegrationService.getIntegration(owner, 'google-calendar');
    return {
      provider: 'google-calendar',
      isConnected: !!integration?.isConnected,
      lastSyncedAt: integration?.lastSyncedAt || null,
      expiresAt: integration?.expiresAt || null,
    };
  }

  async disconnect(owner) {
    return await IntegrationService.disconnect(owner, 'google-calendar');
  }
}
