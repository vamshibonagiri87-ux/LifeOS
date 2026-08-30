import React, { useState } from 'react';
import { api } from '../../services/api.js';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Sparkles,
  Mail,
  AlertCircle,
  Check,
} from 'lucide-react';
import { formatDate } from '../../utils/dates.js';

export function IntegrationCard({
  provider,
  title,
  description,
  icon: Icon,
  status = {},
  onSyncComplete,
  onOpenConnect,
  onOpenConfig,
}) {
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);
  const [syncError, setSyncError] = useState('');

  const isConnected = status.isConnected;
  const isGmail = provider === 'gmail';
  const isReal = status.isLive || status.authType === 'app_password' || (status.authType === 'oauth' && !status.accessToken?.startsWith('mock_'));

  const handleConnectClick = () => {
    if (onOpenConnect) {
      onOpenConnect(provider);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    setSyncError('');
    try {
      const providerKey = provider === 'google-calendar' ? 'calendar' : provider;
      const res = await api.post(`/integrations/${providerKey}/sync`);
      const count = res.data?.data?.syncedCount ?? 0;
      setSyncFeedback(`Successfully synced ${count} real ${isGmail ? 'emails' : 'events'}!`);
      if (onSyncComplete) onSyncComplete();
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncError(err.response?.data?.error?.message || err.message || 'Sync failed. Please check connection.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm(`Are you sure you want to disconnect ${title}?`)) {
      const providerKey = provider === 'google-calendar' ? 'calendar' : provider;
      await api.delete(`/integrations/${providerKey}`);
      setSyncFeedback(null);
      setSyncError('');
      if (onSyncComplete) onSyncComplete();
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-surface/70 border border-border/80 hover:border-primary-500/30 transition flex flex-col justify-between gap-5 shadow-lg shadow-black/10">
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">{title}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                    <XCircle className="w-3.5 h-3.5" />
                    Not connected
                  </span>
                )}

                {isConnected && (
                  isReal ? (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      {status.authType === 'app_password' ? 'Live Gmail (IMAP)' : 'Live Google OAuth'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Dev Simulation Mode
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted leading-relaxed">{description}</p>

        {/* Connected Email Badge */}
        {isConnected && status.accountEmail && (
          <div className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs flex items-center justify-between font-mono">
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5 text-primary-400 shrink-0" />
              <span className="truncate">{status.accountEmail}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-primary-400/80 shrink-0">
              {status.authType === 'app_password' ? 'IMAP/TLS' : 'OAuth'}
            </span>
          </div>
        )}

        {/* Dev Mode Alert */}
        {isConnected && !isReal && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
            <strong>Dev Simulation Active:</strong> Currently showing simulated mock items. Click below to connect your real Gmail address.
          </div>
        )}

        {/* Sync Success Feedback */}
        {syncFeedback && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Sync Error Feedback */}
        {syncError && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {/* Last Synced */}
        {isConnected && status.lastSyncedAt && (
          <div className="text-[11px] text-muted font-mono bg-surface-hover/50 p-2.5 rounded-xl border border-border/40 flex items-center justify-between">
            <span>Last synced:</span>
            <span className="text-foreground">{new Date(status.lastSyncedAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/40">
        {isConnected ? (
          <>
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-primary-600/20 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing Inbox...' : 'Sync Real Emails Now'}</span>
            </button>
            <button
              onClick={() => onOpenConnect && onOpenConnect(provider)}
              title="Change Account / Reconnect"
              className="p-2 rounded-xl bg-surface-hover hover:bg-surface text-muted hover:text-foreground text-xs border border-border/60 transition flex items-center gap-1"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={handleDisconnect}
              className="px-3 py-2 rounded-xl bg-surface-hover hover:bg-rose-500/10 text-muted hover:text-rose-400 text-xs font-semibold transition"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={handleConnectClick}
            className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-600/25 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Connect Real {title}</span>
          </button>
        )}
      </div>
    </div>
  );
}
