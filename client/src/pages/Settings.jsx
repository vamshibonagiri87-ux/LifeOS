import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../services/api.js';
import {
  User,
  ShieldCheck,
  Cpu,
  Sun,
  Moon,
  Lock,
  Radio,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ExternalLink,
  Loader2,
  Check,
  Sparkles,
  Database,
} from 'lucide-react';

export function Settings() {
  const { user, theme, toggleTheme } = useAuthStore();
  const [healthData, setHealthData] = useState(null);

  // AI Configuration Form States
  const [geminiKey, setGeminiKey] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [savingAI, setSavingAI] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingOpenRouter, setTestingOpenRouter] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiError, setAiError] = useState('');

  const fetchHealth = () => {
    api.get('/health').then((res) => setHealthData(res.data)).catch(() => {});
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleSaveAIConfig = async (e) => {
    e.preventDefault();
    setSavingAI(true);
    setAiMessage('');
    setAiError('');
    try {
      const res = await api.post('/integrations/ai-config', {
        geminiApiKey: geminiKey,
        openRouterApiKey: openRouterKey,
      });
      setAiMessage(res.data.message || 'AI Keys saved successfully!');
      fetchHealth();
    } catch (err) {
      console.error('Save AI Config error:', err);
      setAiError(err.response?.data?.error?.message || 'Failed to save AI keys.');
    } finally {
      setSavingAI(false);
    }
  };

  const handleTestKey = async (provider) => {
    const key = provider === 'gemini' ? geminiKey : openRouterKey;
    if (!key.trim()) {
      setAiError(`Please enter a ${provider === 'gemini' ? 'Gemini' : 'OpenRouter'} API key first.`);
      return;
    }

    setAiError('');
    setAiMessage('');
    if (provider === 'gemini') setTestingGemini(true);
    else setTestingOpenRouter(true);

    try {
      const res = await api.post('/integrations/ai-test', {
        provider,
        apiKey: key.trim(),
      });
      setAiMessage(res.data.message || `${provider} API key verified successfully!`);
    } catch (err) {
      console.error('Test AI Key error:', err);
      setAiError(err.response?.data?.error?.message || `${provider} verification failed. Please check key.`);
    } finally {
      if (provider === 'gemini') setTestingGemini(false);
      else setTestingOpenRouter(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          System Settings & AI Health
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Manage your profile, AI agent provider keys, and security settings
        </p>
      </div>

      {/* User Profile */}
      <div className="p-6 rounded-3xl bg-surface/70 border border-border space-y-4 shadow-lg shadow-black/10">
        <h3 className="font-bold text-foreground text-base flex items-center gap-2">
          <User className="w-5 h-5 text-primary-400" />
          User Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-surface-hover/70 border border-border/60">
            <span className="text-muted block">Full Name:</span>
            <span className="font-bold text-foreground mt-0.5 block">{user?.name || 'User'}</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-hover/70 border border-border/60">
            <span className="text-muted block">Email Address:</span>
            <span className="font-bold text-foreground mt-0.5 block">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* AI Provider Keys & Configuration */}
      <div className="p-6 rounded-3xl bg-surface/70 border border-border space-y-5 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" />
            AI Provider Keys & Model Setup
          </h3>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
            Rule Engine Always Ready (Offline)
          </span>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          LifeOS operates out of the box with zero external API keys using its high-speed deterministic extraction engine. To enable advanced conversational reasoning with Google Gemini or OpenRouter, paste your API keys below:
        </p>

        {aiMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{aiMessage}</span>
          </div>
        )}

        {aiError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        <form onSubmit={handleSaveAIConfig} className="space-y-4">
          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>Google Gemini API Key</span>
                {healthData?.ai?.gemini && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded">Active</span>
                )}
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary-400 hover:underline inline-flex items-center gap-0.5"
              >
                <span>Get free Gemini key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder={healthData?.ai?.gemini ? '••••••••••••••••••••••••••••' : 'AIzaSy... (Paste Gemini key)'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-hover/80 border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500 font-mono transition"
              />
              <button
                type="button"
                onClick={() => handleTestKey('gemini')}
                disabled={testingGemini}
                className="px-3 py-2.5 rounded-xl bg-surface-hover text-muted hover:text-foreground border border-border text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
              >
                {testingGemini ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5 text-primary-400" />}
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* OpenRouter API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>OpenRouter API Key</span>
                {healthData?.ai?.openRouter && (
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded">Active</span>
                )}
              </label>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-primary-400 hover:underline inline-flex items-center gap-0.5"
              >
                <span>Get OpenRouter key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder={healthData?.ai?.openRouter ? '••••••••••••••••••••••••••••' : 'sk-or-v1-... (Paste OpenRouter key)'}
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-hover/80 border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500 font-mono transition"
              />
              <button
                type="button"
                onClick={() => handleTestKey('openrouter')}
                disabled={testingOpenRouter}
                className="px-3 py-2.5 rounded-xl bg-surface-hover text-muted hover:text-foreground border border-border text-xs font-semibold flex items-center gap-1 transition disabled:opacity-50"
              >
                {testingOpenRouter ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5 text-primary-400" />}
                <span>Test</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingAI}
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold shadow-md shadow-primary-600/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              {savingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Save AI Provider Keys</span>
            </button>
          </div>
        </form>
      </div>

      {/* AI Health Diagnostics */}
      <div className="p-6 rounded-3xl bg-surface/70 border border-border space-y-4 shadow-lg shadow-black/10">
        <h3 className="font-bold text-foreground text-base flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary-400" />
          AI Provider & Orchestration Health
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-surface-hover/60 border border-border space-y-1">
            <span className="text-muted font-mono">1. Google Gemini</span>
            <div className="flex items-center gap-1.5 font-semibold mt-1">
              {healthData?.ai?.gemini ? (
                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Configured & Active</span>
              ) : (
                <span className="text-muted flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Optional</span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-hover/60 border border-border space-y-1">
            <span className="text-muted font-mono">2. OpenRouter</span>
            <div className="flex items-center gap-1.5 font-semibold mt-1">
              {healthData?.ai?.openRouter ? (
                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Configured & Active</span>
              ) : (
                <span className="text-muted flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Optional</span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-hover/60 border border-border space-y-1">
            <span className="text-muted font-mono">3. Deterministic Engine</span>
            <div className="flex items-center gap-1.5 font-semibold mt-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Always Active (Offline)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database & Storage Health */}
      <div className="p-6 rounded-3xl bg-surface/70 border border-border space-y-4 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Database & Cloud Storage
          </h3>
          <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
            healthData?.database === 'mongodb'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {healthData?.database === 'mongodb' ? 'MongoDB Atlas Connected' : 'In-Memory Fallback'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-surface-hover/60 border border-border space-y-1">
            <span className="text-muted font-mono">Engine Type</span>
            <div className="flex items-center gap-1.5 font-semibold mt-1 text-foreground">
              {healthData?.database === 'mongodb' ? (
                <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> MongoDB Atlas Cloud</span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> In-Memory Mode</span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-hover/60 border border-border space-y-1">
            <span className="text-muted font-mono">Database Name</span>
            <div className="font-bold text-foreground font-mono mt-1 text-xs">
              {healthData?.databaseDetails?.name || 'lifeos'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-hover/60 border border-border space-y-1">
            <span className="text-muted font-mono">Cluster Host</span>
            <div className="text-muted font-mono mt-1 text-[11px] truncate" title={healthData?.databaseDetails?.host || 'MongoDB Atlas'}>
              {healthData?.databaseDetails?.host || 'ac-ljymjbb-shard-00-01'}
            </div>
          </div>
        </div>
      </div>

      {/* Appearance & Theme */}
      <div className="p-6 rounded-3xl bg-surface/70 border border-border space-y-4 shadow-lg shadow-black/10">
        <h3 className="font-bold text-foreground text-base flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
          Appearance & Theme
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-foreground">Current Mode: {theme === 'dark' ? 'Dark Command Center' : 'Light Mode'}</p>
            <p className="text-[11px] text-muted">Switch between dark calm mode and high-contrast light mode</p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-xl bg-surface-hover hover:bg-border text-xs font-semibold text-foreground border border-border transition flex items-center gap-2"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            <span>Toggle Theme</span>
          </button>
        </div>
      </div>

      {/* Security Status */}
      <div className="p-6 rounded-3xl bg-surface/70 border border-border space-y-4 shadow-lg shadow-black/10">
        <h3 className="font-bold text-foreground text-base flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" />
          Security & Encryption
        </h3>
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs space-y-1">
          <p className="font-bold">Credential Encryption Status: ACTIVE (AES-256-GCM)</p>
          <p className="text-emerald-400/80">OAuth access tokens, App Passwords, and API keys are encrypted at rest using server-side keys.</p>
        </div>
      </div>
    </div>
  );
}
