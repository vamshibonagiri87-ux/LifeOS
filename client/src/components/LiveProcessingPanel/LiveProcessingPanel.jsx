import React from 'react';
import { useLifeOSStore } from '../../store/lifeOSStore.js';
import { Cpu, CheckCircle2, Loader2, ArrowRight, Activity } from 'lucide-react';

export function LiveProcessingPanel() {
  const { activeProcessing } = useLifeOSStore();
  const { isProcessing, currentAgent, stepTitle, logs } = activeProcessing;

  const agents = [
    { id: 'EXTRACTION', label: '1. Extraction' },
    { id: 'RELATIONSHIP', label: '2. Relationships' },
    { id: 'VALIDATION', label: '3. Validation' },
    { id: 'PRIORITY', label: '4. Priority' },
    { id: 'COMPLETED', label: '5. Completed' },
  ];

  const getAgentStatus = (agentId) => {
    const order = ['EXTRACTION', 'RELATIONSHIP', 'VALIDATION', 'PRIORITY', 'COMPLETED'];
    const currentIndex = order.indexOf(currentAgent);
    const targetIndex = order.indexOf(agentId);

    if (currentAgent === 'COMPLETED') return 'done';
    if (targetIndex < currentIndex) return 'done';
    if (targetIndex === currentIndex && isProcessing) return 'active';
    return 'idle';
  };

  return (
    <div className="p-5 rounded-3xl bg-surface/80 border border-border/80 backdrop-blur-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${isProcessing ? 'bg-primary-500/10 text-primary-400 border-primary-500/30' : 'bg-surface-hover text-muted border-border'}`}>
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-primary-400" /> : <Cpu className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              Agentic Processing Stream
              {isProcessing && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </h3>
            <p className="text-xs text-muted">
              {isProcessing ? (stepTitle || 'Active pipeline run in progress...') : 'Idle — Listening for incoming sources'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-Time Socket.IO</span>
        </div>
      </div>

      {/* Visual Pipeline Progression */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
        {agents.map((ag) => {
          const status = getAgentStatus(ag.id);
          return (
            <div
              key={ag.id}
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                status === 'active'
                  ? 'bg-primary-500/15 border-primary-500/50 text-primary-300 shadow-sm glow-primary font-semibold'
                  : status === 'done'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-surface/50 border-border/40 text-muted opacity-60'
              }`}
            >
              {status === 'active' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400 shrink-0" />
              ) : status === 'done' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-600 shrink-0" />
              )}
              <span className="truncate">{ag.label}</span>
            </div>
          );
        })}
      </div>

      {/* Mini live log ticker */}
      {logs.length > 0 && (
        <div className="p-3 rounded-xl bg-black/30 border border-border/60 font-mono text-[11px] text-muted space-y-1 max-h-24 overflow-y-auto">
          {logs.slice(0, 3).map((log, idx) => (
            <div key={idx} className="flex items-center gap-2 text-foreground/80 truncate">
              <span className="text-primary-400">[{log.agent || 'PIPELINE'}]</span>
              <span className="truncate">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
