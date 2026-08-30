import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLifeOSStore } from '../store/lifeOSStore.js';
import { MetricGrid } from '../components/MetricGrid/MetricGrid.jsx';
import { PriorityAction } from '../components/PriorityAction/PriorityAction.jsx';
import { LiveProcessingPanel } from '../components/LiveProcessingPanel/LiveProcessingPanel.jsx';
import { ResponsibilityCard } from '../components/ResponsibilityCard/ResponsibilityCard.jsx';
import {
  Sparkles,
  AlertTriangle,
  Calendar,
  Ban,
  Clock,
  ArrowRight,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { formatDate } from '../utils/dates.js';

export function Dashboard() {
  const { dashboard, loadingDashboard, fetchDashboard } = useLifeOSStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const { metrics, priorityAction, sections } = dashboard;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Intelligence Command Center
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time obligation triage and agentic recommendations
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/integrations')}
            className="px-3.5 py-2.5 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 text-primary-300 border border-primary-500/30 text-xs font-semibold flex items-center gap-2 transition"
            title="Connect or sync real Gmail account"
          >
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span>Sync Real Gmail</span>
          </button>
          <button
            onClick={fetchDashboard}
            disabled={loadingDashboard}
            className="p-2.5 rounded-xl bg-surface/80 hover:bg-surface-hover text-muted hover:text-foreground border border-border text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loadingDashboard ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/responsibilities')}
            className="px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-md shadow-primary-600/30 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Manage All Obligations</span>
          </button>
        </div>
      </div>

      {/* 1. Dashboard Metrics Summary Grid */}
      <MetricGrid metrics={metrics} />

      {/* 2. Priority Action Recommendation ("What should I do now?") */}
      <PriorityAction action={priorityAction} />

      {/* 3. Live Processing Stream Banner */}
      <LiveProcessingPanel />

      {/* 4. Core Section Grids: Urgent & Blocked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Obligations */}
        <div className="p-6 rounded-3xl bg-surface/60 border border-border/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-foreground text-sm">Urgent & Critical</h3>
            </div>
            <button
              onClick={() => navigate('/responsibilities')}
              className="text-xs text-primary-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {sections?.urgent?.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center">No critical or urgent deadlines pending.</p>
          ) : (
            <div className="space-y-3">
              {sections.urgent.map((item) => (
                <ResponsibilityCard key={item._id || item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Blocked Obligations */}
        <div className="p-6 rounded-3xl bg-surface/60 border border-border/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Ban className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-foreground text-sm">Blocked & Missing Prerequisites</h3>
            </div>
            <button
              onClick={() => navigate('/responsibilities')}
              className="text-xs text-primary-400 font-semibold hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {sections?.blocked?.length === 0 ? (
            <p className="text-xs text-muted py-6 text-center">None of your responsibilities are currently blocked!</p>
          ) : (
            <div className="space-y-3">
              {sections.blocked.map((item) => (
                <ResponsibilityCard key={item._id || item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Upcoming Deadlines and Calendar Events */}
      <div className="p-6 rounded-3xl bg-surface/60 border border-border/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-foreground text-sm">Upcoming Timeline & Appointments</h3>
          </div>
          <button
            onClick={() => navigate('/responsibilities')}
            className="text-xs text-primary-400 font-semibold hover:underline flex items-center gap-1"
          >
            <span>Full Schedule</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {sections?.upcoming?.length === 0 ? (
          <p className="text-xs text-muted py-8 text-center">No upcoming scheduled deadlines found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sections.upcoming.map((item) => (
              <div
                key={item._id || item.id}
                onClick={() => navigate(`/responsibilities/${item._id || item.id}`)}
                className="p-4 rounded-2xl bg-surface/80 border border-border hover:border-primary-500/30 transition cursor-pointer flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-primary-300 truncate max-w-[150px]">{item.category}</span>
                  <span className="text-[11px] text-muted font-mono">{formatDate(item.deadline)}</span>
                </div>
                <h4 className="font-bold text-sm text-foreground truncate">{item.title}</h4>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
