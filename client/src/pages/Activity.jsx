import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { ProcessingTimeline } from '../components/ProcessingTimeline/ProcessingTimeline.jsx';
import { History, RefreshCw, Loader2 } from 'lucide-react';

export function Activity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity');
      setLogs(res.data.data?.activity || []);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            System Activity & Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Audit history of every detected obligation, deadline change, and agent action
          </p>
        </div>

        <button
          onClick={fetchActivity}
          disabled={loading}
          className="p-2.5 rounded-xl bg-surface/80 hover:bg-surface-hover text-muted hover:text-foreground border border-border text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="p-6 rounded-3xl bg-surface/70 border border-border">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-400 mx-auto" />
          </div>
        ) : (
          <ProcessingTimeline logs={logs} />
        )}
      </div>
    </div>
  );
}
