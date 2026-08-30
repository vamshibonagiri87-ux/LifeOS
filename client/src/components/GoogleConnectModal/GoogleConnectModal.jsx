import React, { useState } from 'react';
import { api } from '../../services/api.js';
import {
  Mail,
  Lock,
  Sparkles,
  Check,
  KeyRound,
  ExternalLink,
  AlertCircle,
  Loader2,
  Globe,
  ShieldCheck,
  X,
  HelpCircle,
  Trash2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export function GoogleConnectModal({ isOpen, onClose, onSuccess, targetProvider = 'gmail', status = {} }) {
  const [activeTab, setActiveTab] = useState('app_password'); // 'app_password' | 'oauth' | 'demo'
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [purgeDemoOnConnect, setPurgeDemoOnConnect] = useState(true);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isCalendar = targetProvider === 'google-calendar' || targetProvider === 'calendar';
  const providerTitle = isCalendar ? 'Google Calendar' : 'Gmail';
  const providerKey = isCalendar ? 'calendar' : 'gmail';
  const redirectUri = 'http://localhost:5000/api/integrations/oauth/google/callback';

  const handleTestConnection = async () => {
    setError('');
    setTestSuccess(false);
    if (!email.trim()) {
      setError('Please enter your Gmail address first.');
      return;
    }
    if (!appPassword.trim()) {
      setError('Please enter your 16-character Google App Password to test.');
      return;
    }

    setTesting(true);
    try {
      const res = await api.post('/integrations/test-connection', {
        provider: 'gmail',
        email: email.trim(),
        appPassword: appPassword.trim(),
      });
      setTestSuccess(true);
    } catch (err) {
      console.error('Test connection error:', err);
      setError(err.response?.data?.error?.message || 'Connection test failed. Please check your App Password.');
    } finally {
      setTesting(false);
    }
  };

  const handleAppPasswordConnect = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your Google account email.');
      return;
    }

    if (!appPassword.trim()) {
      setError('Please enter your 16-character Google App Password.');
      return;
    }

    setLoading(true);
    try {
      // 1. Optionally purge old demo obligations if user requested a fresh start
      if (purgeDemoOnConnect) {
        try {
          await api.post('/integrations/purge-demo', { purgeAll: false });
        } catch (pErr) {
          console.warn('Purge demo warning:', pErr);
        }
      }

      // 2. Connect Gmail with verified App Password
      await api.post(`/integrations/${providerKey}/connect-direct`, {
        email: email.trim(),
        appPassword: appPassword.trim(),
        mode: 'app_password',
      });

      // 3. Immediately trigger initial live inbox sync
      try {
        await api.post(`/integrations/${providerKey}/sync`);
      } catch (syncErr) {
        console.warn('Initial sync warning:', syncErr);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err.response?.data?.error?.message || 'Failed to connect Gmail. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthConnect = async () => {
    setError('');
    setLoading(true);
    try {
      if (clientId.trim() && clientSecret.trim()) {
        await api.post('/integrations/google/config', {
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
          redirectUri,
        });
      }

      const res = await api.get(`/integrations/${providerKey}/start`);
      if (res.data.data?.authUrl) {
        const width = 540;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const popup = window.open(
          res.data.data.authUrl,
          'GoogleOAuthSignIn',
          `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes,scrollbars=yes`
        );

        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          window.location.href = res.data.data.authUrl;
        } else {
          onClose();
          if (onSuccess) onSuccess();
        }
      }
    } catch (err) {
      console.error('OAuth start failed:', err);
      setError(err.response?.data?.error?.message || 'Failed to start Google sign-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoConnect = async () => {
    setLoading(true);
    try {
      await api.post(`/integrations/${providerKey}/connect-direct`, {
        email: email.trim() || 'demo.user@gmail.com',
        mode: 'dev',
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Demo connection failed:', err);
      setError('Failed to connect demo mode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-2.5 shadow-lg border border-border shrink-0">
              <svg className="w-full h-full" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-foreground text-lg tracking-tight">Connect Real {providerTitle}</h3>
              <p className="text-xs text-muted mt-0.5">
                Sync live emails, obligations, and deadlines into your Command Center
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted hover:text-foreground hover:bg-surface-hover transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 bg-surface-hover/80 p-1.5 rounded-2xl border border-border text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('app_password'); setError(''); }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'app_password'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Gmail App Password (Fastest)</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('oauth'); setError(''); }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'oauth'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Google Cloud OAuth</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Test Success Notification */}
        {testSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Gmail connection verified! Credentials are valid and ready to sync.</span>
          </div>
        )}

        {/* TAB 1: Real Gmail Connection with App Password */}
        {activeTab === 'app_password' && (
          <form onSubmit={handleAppPasswordConnect} className="space-y-4">
            {/* Quick 3-step Instructions */}
            <div className="p-4 rounded-2xl bg-surface-hover/70 border border-border/80 space-y-2.5 text-xs text-muted">
              <div className="flex items-center justify-between text-foreground font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>How to connect your real Gmail in 30 seconds:</span>
                </span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-muted leading-relaxed pl-1">
                <li>
                  Open{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-400 underline font-semibold inline-flex items-center gap-0.5 hover:text-primary-300"
                  >
                    myaccount.google.com/apppasswords
                    <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  (requires Google 2-Step Verification ON).
                </li>
                <li>Enter <strong className="text-foreground">"LifeOS"</strong> as the App name and click <strong>Create</strong>.</li>
                <li>Copy the 16-letter password (e.g., <code className="text-primary-300 bg-surface px-1 py-0.5 rounded font-mono">abcd efgh ijkl mnop</code>) and paste it below.</li>
              </ol>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Your Real Gmail Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setTestSuccess(false); }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-hover/80 border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500 transition font-medium"
                />
              </div>
            </div>

            {/* 16-Char App Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  16-Character Google App Password <span className="text-rose-400">*</span>
                </label>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-primary-400 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>Generate code</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="abcd efgh ijkl mnop"
                  value={appPassword}
                  onChange={(e) => { setAppPassword(e.target.value); setTestSuccess(false); }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-hover/80 border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500 font-mono tracking-wider transition"
                />
              </div>
            </div>

            {/* Purge Demo Data Checkbox */}
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-hover/40 border border-border/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={purgeDemoOnConnect}
                onChange={(e) => setPurgeDemoOnConnect(e.target.checked)}
                className="rounded border-border text-primary-600 focus:ring-0 w-4 h-4 cursor-pointer"
              />
              <span className="text-[11px] text-muted leading-tight">
                <strong className="text-foreground font-semibold">Clean Slate:</strong> Automatically purge fake/demo responsibilities upon connecting real email.
              </span>
            </label>

            {/* Buttons */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || loading}
                  className="px-4 py-2.5 rounded-xl bg-surface-hover text-muted hover:text-foreground border border-border text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5 text-primary-400" />}
                  <span>{testing ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading || testing}
                  className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-lg shadow-primary-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying & Syncing Inbox...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Connect & Sync Real Gmail</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleDemoConnect}
                disabled={loading || testing}
                className="w-full py-2 rounded-xl bg-transparent text-muted hover:text-foreground text-[11px] font-medium flex items-center justify-center gap-1 transition"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Need a quick test? Use simulated dev mode instead</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Official Google Cloud OAuth */}
        {activeTab === 'oauth' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-surface-hover/60 border border-border text-xs text-muted space-y-2">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-primary-400" />
                <span>Google Cloud OAuth 2.0:</span>
              </p>
              <p className="leading-relaxed">
                Connect using official Google Cloud OAuth consent. If you have registered a Google Cloud Project with the Gmail API enabled, enter your credentials below or configure them in <code className="text-primary-300 font-mono">server/.env</code>.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-surface-hover/40 border border-border/80">
              <p className="text-xs font-bold text-foreground">Google Cloud Credentials:</p>
              <input
                type="text"
                placeholder="Google Client ID (e.g. 123...apps.googleusercontent.com)"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500 font-mono transition"
              />
              <input
                type="password"
                placeholder="Google Client Secret"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500 font-mono transition"
              />
            </div>

            <button
              type="button"
              onClick={handleOAuthConnect}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-xl flex items-center justify-center gap-3 transition disabled:opacity-50 border border-slate-200"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Opening Google Sign-In...' : 'Sign In with Google (Official Popup)'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
