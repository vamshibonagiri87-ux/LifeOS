import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { IntegrationCard } from '../components/IntegrationCard/IntegrationCard.jsx';
import { GoogleConnectModal } from '../components/GoogleConnectModal/GoogleConnectModal.jsx';
import { GoogleConfigModal } from '../components/GoogleConfigModal/GoogleConfigModal.jsx';
import {
  Mail,
  Calendar,
  Radio,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  X,
  KeyRound,
  Globe,
  Sparkles,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export function Integrations() {
  const [integrations, setIntegrations] = useState({});
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [alertMsg, setAlertMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('gmail');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/integrations/status');
      setIntegrations(res.data.data?.integrations || {});
    } catch (err) {
      console.error('Failed to fetch integrations status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected) {
      setAlertMsg(`Successfully connected ${connected}! LifeOS is now ready to ingest real obligations.`);
      setErrorMsg('');
      setSearchParams({}, { replace: true });
    } else if (error) {
      setErrorMsg(`Integration connection failed: ${error}`);
      setAlertMsg('');
      setSearchParams({}, { replace: true });
    }

    // Listen for popup OAuth completion messages
    const handleAuthMessage = (event) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        fetchStatus();
        const providerName = event.data.provider === 'gmail' ? 'Gmail' : 'Google Calendar';
        setAlertMsg(`Successfully connected ${providerName}! Real emails are now synced.`);
        setErrorMsg('');
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        setErrorMsg(`Google sign-in error: ${decodeURIComponent(event.data.error || 'Authentication failed')}`);
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [searchParams, setSearchParams]);

  const handleOpenConnect = (provider) => {
    setSelectedProvider(provider);
    setConnectModalOpen(true);
  };

  const handleOpenConfig = (provider) => {
    setSelectedProvider(provider);
    setConfigModalOpen(true);
  };

  const handlePurgeDemoData = async (purgeAll = false) => {
    const confirmText = purgeAll
      ? 'Clear ALL obligations and sources to start with a completely empty slate for real email sync?'
      : 'Purge all fake/simulated sample obligations and mock sources?';

    if (!confirm(confirmText)) return;

    setPurging(true);
    setErrorMsg('');
    try {
      const res = await api.post('/integrations/purge-demo', { purgeAll });
      setAlertMsg(res.data?.message || 'Demo data purged successfully!');
      fetchStatus();
    } catch (err) {
      console.error('Failed to purge demo data:', err);
      setErrorMsg(err.response?.data?.error?.message || 'Failed to purge demo data.');
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Connected Ingestion Accounts
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Link your real Gmail account to feed live emails and extract genuine obligations
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Purge Demo Data Button */}
          <button
            onClick={() => handlePurgeDemoData(false)}
            disabled={purging}
            title="Remove simulated mock items and keep only real synced data"
            className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {purging ? <Loader2 className="w-4 h-4 animate-spin text-rose-400" /> : <Trash2 className="w-4 h-4 text-rose-400" />}
            <span>Clear Demo Data</span>
          </button>

          <button
            onClick={() => handleOpenConfig('google-calendar')}
            className="p-2.5 rounded-xl bg-surface/80 hover:bg-surface-hover text-muted hover:text-foreground border border-border text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <KeyRound className="w-4 h-4 text-primary-400" />
            <span>OAuth Keys</span>
          </button>

          <button
            onClick={fetchStatus}
            disabled={loading}
            className="p-2.5 rounded-xl bg-surface/80 hover:bg-surface-hover text-muted hover:text-foreground border border-border text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Success Alert Banner */}
      {alertMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{alertMsg}</span>
          </div>
          <button onClick={() => setAlertMsg('')} className="text-muted hover:text-foreground p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-muted hover:text-foreground p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Security & Real Connection Note */}
      <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-300 text-xs flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-primary-400 shrink-0" />
          <span className="leading-relaxed">
            <strong>Real Gmail Integration:</strong> Connect your real Gmail account with a 16-letter App Password or Google Cloud OAuth to automatically extract obligations, deadlines, and requirements from your actual inbox.
          </span>
        </div>
        <button
          onClick={() => handleOpenConnect('gmail')}
          className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs shadow transition shrink-0"
        >
          Connect Gmail Now
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gmail Card */}
        <IntegrationCard
          provider="gmail"
          title="Gmail Integration"
          description="Monitors incoming real email threads over secure TLS to extract invoices, bills, appointment invites, job applications, and obligations."
          icon={Mail}
          status={integrations.gmail || {}}
          onSyncComplete={fetchStatus}
          onOpenConnect={handleOpenConnect}
          onOpenConfig={handleOpenConfig}
        />

        {/* Google Calendar Card */}
        <IntegrationCard
          provider="google-calendar"
          title="Google Calendar"
          description="Syncs appointments, exams, and scheduled meetings while detecting preparation documents needed beforehand."
          icon={Calendar}
          status={integrations['google-calendar'] || {}}
          onSyncComplete={fetchStatus}
          onOpenConnect={handleOpenConnect}
          onOpenConfig={handleOpenConfig}
        />
      </div>

      {/* Google Connect Modal */}
      <GoogleConnectModal
        isOpen={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onSuccess={() => {
          fetchStatus();
          setAlertMsg('Google account successfully connected and synced!');
        }}
        targetProvider={selectedProvider}
        status={integrations[selectedProvider] || {}}
      />

      {/* Google OAuth Config Modal */}
      <GoogleConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onSuccess={() => {
          fetchStatus();
          setAlertMsg('Google OAuth credentials saved!');
        }}
        targetProvider={selectedProvider}
      />
    </div>
  );
}
