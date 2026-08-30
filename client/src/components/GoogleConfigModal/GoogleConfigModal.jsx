import React, { useState } from 'react';
import { api } from '../../services/api.js';
import { KeyRound, X, Check, Copy, ExternalLink, AlertCircle, Sparkles, Loader2, Globe } from 'lucide-react';

export function GoogleConfigModal({ isOpen, onClose, onSuccess, onConnectDemo, targetProvider = 'google-calendar' }) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const redirectUri = 'http://localhost:5000/api/integrations/oauth/google/callback';

  const handleCopyUri = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAndConnect = async (e) => {
    e.preventDefault();
    setError('');

    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Please provide both Google Client ID and Client Secret.');
      return;
    }

    setSaving(true);
    try {
      // 1. Save credentials to server backend
      await api.post('/integrations/google/config', {
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        redirectUri,
      });

      // 2. Fetch the Google OAuth consent screen URL
      const providerKey = targetProvider === 'google-calendar' ? 'calendar' : targetProvider;
      const res = await api.get(`/integrations/${providerKey}/start`);

      if (res.data.data?.authUrl) {
        const width = 520;
        const height = 680;
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
      } else {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Failed to save Google credentials:', err);
      setError(err.response?.data?.error?.message || 'Failed to save Google credentials. Please check your inputs.');
      setSaving(false);
    }
  };

  const handleDemoClick = () => {
    onClose();
    if (onConnectDemo) onConnectDemo(targetProvider);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl bg-surface border border-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Connect Your Real Google Account</h3>
              <p className="text-xs text-muted mt-0.5">
                Enable real-time synchronization for {targetProvider === 'google-calendar' ? 'Google Calendar' : 'Gmail'}
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

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Instructions */}
        <div className="p-4 rounded-2xl bg-surface-hover/60 border border-border/80 text-xs text-muted space-y-2">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-primary-400" />
            <span>Google Cloud OAuth Setup:</span>
          </p>
          <ol className="list-decimal list-inside space-y-1 leading-relaxed pl-1">
            <li>
              Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-primary-400 font-semibold hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="w-3 h-3" /></a>.
            </li>
            <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
            <li>
              Set the <strong>Authorized redirect URI</strong> to:
              <div className="mt-1 flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-border font-mono text-[11px] text-foreground">
                <span className="flex-1 truncate">{redirectUri}</span>
                <button
                  type="button"
                  onClick={handleCopyUri}
                  className="px-2 py-1 rounded-lg bg-surface hover:bg-surface-hover text-muted hover:text-foreground text-[10px] font-semibold flex items-center gap-1 transition"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </li>
          </ol>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveAndConnect} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Google Client ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 1234567890-abcdefg.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-hover/80 border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500 font-mono transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Google Client Secret <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="e.g. GOCSPX-xxxxxxxxxxxxxxxx"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-hover/80 border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500 font-mono transition"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-lg shadow-primary-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving & Redirecting to Google Sign-In...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Save & Proceed to Official Google Sign-In</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDemoClick}
              disabled={saving}
              className="w-full py-2.5 rounded-xl bg-surface-hover text-muted hover:text-foreground text-xs font-semibold border border-border flex items-center justify-center gap-1.5 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Continue with Demo Mode (Simulated Data)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
