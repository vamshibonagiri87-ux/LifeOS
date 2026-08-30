import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { ProcessingTimeline } from '../components/ProcessingTimeline/ProcessingTimeline.jsx';
import {
  ArrowLeft,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  XCircle,
  Loader2,
} from 'lucide-react';
import { formatDate } from '../utils/dates.js';

export function ProcessingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [run, setRun] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/processing/${id}/timeline`);
      setRun(res.data.data?.processingRun);
      setTimeline(res.data.data?.timeline || []);
    } catch (err) {
      console.error('Failed to fetch run timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleAction = async (action) => {
    try {
      await api.post(`/processing/${id}/${action}`);
      fetchDetails();
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400 mx-auto" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="py-24 text-center space-y-3">
        <h2 className="font-bold text-foreground text-xl">Processing run not found</h2>
        <button
          onClick={() => navigate('/processing')}
          className="text-primary-400 text-sm font-semibold hover:underline"
        >
          Return to Processing Runs
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Runs</span>
      </button>

      {/* Header Info Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-surface/80 border border-border shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30">
              {run.status}
            </span>
            <span className="text-xs text-muted font-mono">
              Current: <strong className="text-foreground">{run.currentAgent}</strong>
            </span>
          </div>

          {/* Lifecycle actions */}
          <div className="flex items-center gap-2">
            {run.status === 'RUNNING' && (
              <button
                onClick={() => handleAction('pause')}
                className="px-3 py-1.5 rounded-xl bg-surface-hover text-muted hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            )}
            {run.status === 'PAUSED' && (
              <button
                onClick={() => handleAction('resume')}
                className="px-3 py-1.5 rounded-xl bg-primary-600 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume</span>
              </button>
            )}
            {run.status === 'RUNNING' && (
              <button
                onClick={() => handleAction('cancel')}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {run.input?.title || `Pipeline Execution for Source ${run.sourceId}`}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted mt-2 font-mono">
            <span>Duration: {run.duration || 0}ms</span>
            <span>Started: {new Date(run.createdAt || run.startTime).toLocaleTimeString()}</span>
            <span>LangGraph: Available</span>
          </div>
        </div>
      </div>

      {/* 6-Agent Execution Timeline */}
      <div className="p-6 rounded-3xl bg-surface/60 border border-border space-y-6">
        <h3 className="font-bold text-foreground text-base flex items-center gap-2">
          <Cpu className="w-5 h-5 text-primary-400" />
          Agent Step Execution Timeline
        </h3>

        <ProcessingTimeline logs={timeline} />
      </div>
    </div>
  );
}
