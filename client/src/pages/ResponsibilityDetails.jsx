import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLifeOSStore } from '../store/lifeOSStore.js';
import { api } from '../services/api.js';
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Copy,
  Layers,
  GitBranch,
  ShieldCheck,
  CheckSquare,
  Square,
  Ban,
  FileText,
} from 'lucide-react';
import { formatDate, getDeadlineCountdown } from '../utils/dates.js';
import { getPriorityStyles, getCategoryBadge } from '../utils/priority.js';

export function ResponsibilityDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchResponsibilityById, deleteResponsibility, updateResponsibilityStatus } = useLifeOSStore();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [explainData, setExplainData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchResponsibilityById(id);
    setItem(data);
    try {
      const expRes = await api.get(`/responsibilities/${id}/explain-priority`);
      setExplainData(expRes.data.data);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="py-24 text-center space-y-3">
        <h2 className="font-bold text-foreground text-xl">Obligation not found</h2>
        <button
          onClick={() => navigate('/responsibilities')}
          className="text-primary-400 text-sm font-semibold hover:underline"
        >
          Return to Obligations List
        </button>
      </div>
    );
  }

  const priorityStyles = getPriorityStyles(item.priority);
  const categoryBadge = getCategoryBadge(item.category);
  const countdown = getDeadlineCountdown(item.deadline);

  const handleToggleRequirement = async (reqId) => {
    const updatedReqs = (item.requirements || []).map((r) =>
      r.id === reqId ? { ...r, completed: !r.completed, completedAt: !r.completed ? new Date() : null } : r
    );

    const res = await api.put(`/responsibilities/${id}`, { requirements: updatedReqs });
    setItem(res.data.data.responsibility);
  };

  const handleStatusChange = async (newStatus) => {
    await updateResponsibilityStatus(id, newStatus);
    loadData();
  };

  const handleDelete = async () => {
    if (confirm('Delete this obligation?')) {
      await deleteResponsibility(id);
      navigate('/responsibilities');
    }
  };

  const reqTotal = item.requirements?.length || 0;
  const reqCompleted = item.requirements?.filter((r) => r.completed)?.length || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="p-2 text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
            title="Delete Obligation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl bg-surface/80 border border-border space-y-4 shadow-xl ${priorityStyles.border}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${categoryBadge.color}`}>
              {categoryBadge.label}
            </span>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${priorityStyles.badge}`}>
              {item.priority} Priority ({item.priorityScore}/100)
            </span>
            {item.status === 'BLOCKED' && (
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                <Ban className="w-3.5 h-3.5" />
                Blocked
              </span>
            )}
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Status:</span>
            <select
              value={item.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs bg-surface-hover font-semibold border border-border rounded-xl px-3 py-1.5 text-foreground focus:outline-none focus:border-primary-500"
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING">Waiting</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {item.title}
          </h1>
          <p className="text-sm text-muted mt-2 leading-relaxed whitespace-pre-wrap">
            {item.description || 'No detailed description available.'}
          </p>
        </div>

        {/* Info badges */}
        <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border/60 text-xs text-muted">
          {item.deadline && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-primary-400" />
              <span>Due: {formatDate(item.deadline)}</span>
              <span className={`font-semibold ml-1 ${countdown.color}`}>({countdown.text})</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AI Confidence: {Math.round((item.confidenceScore || 0.9) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Requirements & Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requirements Checklist */}
        <div className="p-6 rounded-3xl bg-surface/60 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-foreground text-base">Required Items & Checklists</h3>
            </div>
            <span className="text-xs font-semibold text-muted font-mono">
              {reqCompleted}/{reqTotal} ({item.completionPercentage || 0}%)
            </span>
          </div>

          {reqTotal === 0 ? (
            <p className="text-xs text-muted py-4">No specific document or prerequisite requirements specified.</p>
          ) : (
            <div className="space-y-2">
              {item.requirements.map((req) => (
                <div
                  key={req.id}
                  onClick={() => handleToggleRequirement(req.id)}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition ${
                    req.completed
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-surface-hover/70 border-border text-foreground hover:border-primary-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {req.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-muted shrink-0" />
                    )}
                    <span className={`text-xs font-medium ${req.completed ? 'line-through opacity-80' : ''}`}>
                      {req.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted uppercase font-mono">
                    {req.completed ? 'Done' : 'Missing'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Priority "Why?" Explainability Box */}
        <div className="p-6 rounded-3xl bg-surface/60 border border-border space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" />
            <h3 className="font-bold text-foreground text-base">Priority Score & AI Reasoning</h3>
          </div>

          <div className="p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-xs leading-relaxed">
            <strong className="text-primary-300 block mb-1">Reasoning Analysis:</strong>
            {item.priorityExplanation?.reason || 'Calculated by Priority Agent based on urgency, deadline penalty, and active dependencies.'}
          </div>

          {item.priorityExplanation?.breakdown && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Scoring Breakdown:</span>
              {item.priorityExplanation.breakdown.map((b, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface-hover/70 border border-border/50">
                  <span className="text-muted">{b.reason}</span>
                  <span className="font-semibold text-primary-400 font-mono">+{b.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dependency Graph & Connected Relationships */}
      {item.dependencies && item.dependencies.length > 0 && (
        <div className="p-6 rounded-3xl bg-surface/60 border border-border space-y-4">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-foreground text-base">Dependency Relationships</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {item.dependencies.map((dep, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-surface/80 border border-border flex items-center justify-between gap-2 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase font-semibold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                    {dep.type}
                  </span>
                  <p className="font-bold text-foreground mt-1">{dep.title || 'Linked Obligation'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
