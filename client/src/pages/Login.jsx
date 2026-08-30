import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Sparkles, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export function Login() {
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 selection:bg-primary-500 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-400 mx-auto flex items-center justify-center shadow-xl shadow-primary-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Sign in to LifeOS
          </h2>
          <p className="text-xs text-muted">Access your personal obligation command center</p>
        </div>

        {/* Card */}
        <div className="p-7 sm:p-8 rounded-3xl bg-surface/80 border border-border/80 shadow-2xl backdrop-blur-xl space-y-5">
          {(formError || error) && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-hover/70 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500 transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-hover/70 border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold shadow-lg shadow-primary-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setEmail('demo@lifeos.ai');
                setPassword('password123');
                const res = await login('demo@lifeos.ai', 'password123');
                if (res.success) {
                  navigate('/dashboard');
                }
              }}
              className="w-full py-2.5 rounded-xl bg-surface-hover/80 hover:bg-surface-hover text-muted hover:text-foreground text-xs font-semibold border border-border flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary-400" />
              <span>⚡ One-Click Demo Login (demo@lifeos.ai)</span>
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
