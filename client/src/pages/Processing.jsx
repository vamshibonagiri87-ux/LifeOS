import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { LiveProcessingPanel } from '../components/LiveProcessingPanel/LiveProcessingPanel.jsx';
import { Cpu, Clock, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { formatDate } from '../utils/dates.js';

export function Processing() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/processing');
      setRuns(res.data.data?.processingRuns || []);
    } catch (err) {
      console.error('Failed to fetch processing runs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'RUNNING':
        return 'bg-primary-500/10 text-primary-400 border border-primary-500/20 animate-pulse';
      case 'FAILED':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default:
        return 'bg-slate-700 text-slate-300 border border-slate-600';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            AI Agent Pipeline & Runs
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time execution log of the 6 cooperating AI agents
          </p>
        </div>

        <button
          onClick={fetchRuns}
          disabled={loading}
          className="p-2.5 rounded-xl bg-surface/80 hover:bg-surface-hover text-muted hover:text-foreground border border-border text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Runs</span>
        </button>
      </div>

      {/* Live Stream Panel */}
      <LiveProcessingPanel />

      {/* Runs History Table */}
      <div className="p-6 rounded-3xl bg-surface/80 border border-border space-y-4">
        <h3 className="font-bold text-foreground text-base">Processing History</h3>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-400 mx-auto" />
          </div>
        ) : runs.length === 0 ? (
          <div className="py-12 text-center text-muted border border-dashed border-border rounded-2xl">
            <Cpu className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No processing runs recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => {
              const runId = run._id || run.id;
              return (
                <div
                  key={runId}
                  onClick={() => navigate(`/processing/${runId}`)}
                  className="p-4 rounded-2xl bg-surface/60 border border-border/80 hover:border-primary-500/30 hover:bg-surface-hover/60 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold font-mono ${getStatusBadge(run.status)}`}>
                        {run.status}
                      </span>
                      <span className="text-xs text-muted font-mono">
                        Agent: <strong className="text-primary-300">{run.currentAgent}</strong>
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground">
                      {run.input?.title || `Source Processing (${run.sourceId})`}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 text-xs text-muted">
                    <div className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{run.duration ? `${run.duration}ms` : 'In progress'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary-400 font-semibold text-xs">
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
