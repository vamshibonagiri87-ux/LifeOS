import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Calendar,
  FileText,
  Cpu,
  Lock,
  Zap,
} from 'lucide-react';

export function Landing() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary-500 selection:text-white">
      {/* Navigation */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 via-primary-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">LifeOS</span>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold shadow-lg shadow-primary-600/30 flex items-center gap-2 transition"
            >
              <span>Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-muted hover:text-foreground transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold shadow-lg shadow-primary-600/30 flex items-center gap-2 transition"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl w-full mx-auto px-6 py-16 text-center space-y-8 my-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/30 text-primary-300 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-primary-400" />
          <span>AI-Powered Personal Obligation Intelligence Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
          What do I need to do, why does it matter, and{' '}
          <span className="bg-gradient-to-r from-primary-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            what should I do first?
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          LifeOS ingests fragmented information from your <strong>Gmail</strong>, <strong>Google Calendar</strong>, and <strong>uploaded documents</strong>, transforming them into a calm, continuously updated command center of prioritized responsibilities, missing requirements, and dependency graphs.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={isAuthenticated ? '/dashboard' : '/register'}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-semibold shadow-xl shadow-primary-600/30 flex items-center justify-center gap-2 transition text-base"
          >
            <span>{isAuthenticated ? 'Open Dashboard' : 'Launch LifeOS Platform'}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-surface-hover/80 hover:bg-surface-hover text-foreground font-semibold border border-border flex items-center justify-center gap-2 transition text-base"
          >
            <span>Existing Account</span>
          </Link>
        </div>

        {/* 3 Core Ingestion Sources Visual */}
        <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
          <div className="p-6 rounded-3xl bg-surface/60 border border-border/80 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground text-base">Gmail Ingestion</h3>
            <p className="text-xs text-muted leading-relaxed">
              Extracts interview invitations, payment due dates, invoices, and instructions directly from email threads with zero manual data entry.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-surface/60 border border-border/80 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground text-base">Google Calendar</h3>
            <p className="text-xs text-muted leading-relaxed">
              Detects appointments, exam dates, deadlines, and syncs required preparation steps before each event occurs.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-surface/60 border border-border/80 backdrop-blur-md space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-foreground text-base">Document Parsing</h3>
            <p className="text-xs text-muted leading-relaxed">
              Upload PDFs and text files to automatically extract prerequisite checklists (e.g. Resume, ID Proof, Marks Memo) and compute completion %.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LifeOS — Personal Obligation Intelligence Platform</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AES-256 Encrypted</span>
            <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-primary-400" /> 6-Agent AI Architecture</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
