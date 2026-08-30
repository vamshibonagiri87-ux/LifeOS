import React from 'react';
import { CheckCircle2, AlertCircle, Clock, Info, ShieldAlert } from 'lucide-react';
import { formatDate } from '../../utils/dates.js';

export function ProcessingTimeline({ logs = [] }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="p-8 text-center text-muted border border-dashed border-border rounded-2xl">
        No execution timeline logs available for this processing run.
      </div>
    );
  }

  const getAgentColor = (agent) => {
    switch (agent) {
      case 'EXTRACTION':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'RELATIONSHIP':
        return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'VALIDATION':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'PRIORITY':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      case 'RECOVERY':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'MONITORING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-muted bg-surface-hover border-border';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'WARNING':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
      {logs.map((log, idx) => (
        <div key={log._id || log.id || idx} className="relative group">
          {/* Dot */}
          <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center shadow">
            {getLevelIcon(log.level)}
          </div>

          <div className="p-4 rounded-2xl bg-surface/70 border border-border/80 group-hover:border-primary-500/30 transition space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold border ${getAgentColor(log.agent)}`}>
                {log.agent} AGENT
              </span>
              <span className="text-[11px] text-muted flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                {new Date(log.createdAt).toLocaleTimeString()}
              </span>
            </div>

            <p className="text-xs text-foreground leading-relaxed">{log.message}</p>

            {log.metadata && Object.keys(log.metadata).length > 0 && (
              <pre className="p-2.5 rounded-xl bg-black/40 text-[10px] text-muted font-mono overflow-x-auto">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
