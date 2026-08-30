import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLifeOSStore } from '../../store/lifeOSStore.js';
import { Sparkles, ArrowRight, HelpCircle, CheckCircle2, Clock, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { formatDate, getDeadlineCountdown } from '../../utils/dates.js';
import { getPriorityStyles } from '../../utils/priority.js';

export function PriorityAction({ action }) {
  const navigate = useNavigate();
  const { updateResponsibilityStatus } = useLifeOSStore();
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [completing, setCompleting] = useState(false);

  if (!action) {
    return (
      <div className="p-6 rounded-3xl bg-gradient-to-r from-surface to-surface/80 border border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-base">All clear for right now!</h3>
            <p className="text-xs text-muted mt-0.5">No pressing critical obligations need immediate attention.</p>
          </div>
        </div>
      </div>
    );
  }

  const priorityStyles = getPriorityStyles(action.priority);
  const countdown = getDeadlineCountdown(action.deadline);
  const actionId = action._id || action.id;

  const handleMarkComplete = async (e) => {
    e.stopPropagation();
    setCompleting(true);
    await updateResponsibilityStatus(actionId, 'COMPLETED');
    setCompleting(false);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-900/40 via-surface to-surface border border-primary-500/30 p-6 sm:p-7 shadow-xl shadow-primary-950/20">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-3 flex-1 min-w-0">
            {/* Header tag */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-500/20 text-primary-300 border border-primary-500/40">
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                Recommended Next Action
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${priorityStyles.badge}`}>
                {action.priority} (Score: {action.priorityScore}/100)
              </span>
              {action.deadline && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs ${countdown.badgeClass}`}>
                  {countdown.text}
                </span>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
                {action.title}
              </h2>
              <p className="text-sm text-muted mt-1.5 line-clamp-2 leading-relaxed">
                {action.description || 'Action recommended by LifeOS Priority Agent based on urgency and dependencies.'}
              </p>
            </div>

            {/* Missing reqs warning if any */}
            {action.missingRequirements && action.missingRequirements.length > 0 && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Missing: <strong>{action.missingRequirements.join(', ')}</strong></span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowWhyModal(true)}
              className="px-4 py-2.5 rounded-xl bg-surface-hover/80 hover:bg-surface-hover text-muted hover:text-foreground text-xs font-semibold border border-border flex items-center gap-2 transition"
            >
              <HelpCircle className="w-4 h-4 text-primary-400" />
              Why this task?
            </button>
            <button
              onClick={handleMarkComplete}
              disabled={completing}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {completing ? 'Completing...' : 'Mark Done'}
            </button>
            <button
              onClick={() => navigate(`/responsibilities/${actionId}`)}
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-lg shadow-primary-600/30 flex items-center gap-2 transition"
            >
              <span>View Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* "Why?" Explainability Modal */}
      {showWhyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-surface border border-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-primary-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-bold text-foreground text-lg">Priority Explainability</h3>
              </div>
              <button
                onClick={() => setShowWhyModal(false)}
                className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="font-semibold text-foreground text-sm">{action.title}</h4>
              <p className="text-xs text-muted mt-1">
                Calculated Priority Score: <span className="text-primary-400 font-bold">{action.priorityScore}/100</span> ({action.priority})
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-xs leading-relaxed text-foreground">
              <strong className="text-primary-300 block mb-1">AI Reasoning Summary:</strong>
              {action.priorityExplanation?.reason || 'Calculated based on deadline urgency, dependency blockers, and missing prerequisites.'}
            </div>

            {action.priorityExplanation?.breakdown && action.priorityExplanation.breakdown.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">Score Breakdown:</span>
                <div className="space-y-1.5">
                  {action.priorityExplanation.breakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-hover/60 border border-border/40">
                      <span className="text-muted">{item.reason}</span>
                      <span className="font-semibold text-primary-400">+{item.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowWhyModal(false)}
              className="w-full py-2.5 rounded-xl bg-surface-hover text-foreground text-xs font-semibold hover:bg-border transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
