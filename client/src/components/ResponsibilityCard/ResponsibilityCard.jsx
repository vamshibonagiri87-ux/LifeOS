import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLifeOSStore } from '../../store/lifeOSStore.js';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Copy,
  ChevronRight,
  Sparkles,
  Ban,
  FileText,
} from 'lucide-react';
import { formatDate, getDeadlineCountdown } from '../../utils/dates.js';
import { getPriorityStyles, getCategoryBadge } from '../../utils/priority.js';
import { getStatusBadge } from '../../utils/status.js';

export function ResponsibilityCard({ item }) {
  const navigate = useNavigate();
  const { updateResponsibilityStatus, deleteResponsibility } = useLifeOSStore();
  const [showMenu, setShowMenu] = useState(false);
  const [updating, setUpdating] = useState(false);

  const itemId = item._id || item.id;
  const priorityStyles = getPriorityStyles(item.priority);
  const statusBadge = getStatusBadge(item.status);
  const categoryBadge = getCategoryBadge(item.category);
  const countdown = getDeadlineCountdown(item.deadline);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    await updateResponsibilityStatus(itemId, newStatus);
    setUpdating(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (confirm(`Delete obligation "${item.title}"?`)) {
      await deleteResponsibility(itemId);
    }
  };

  const reqTotal = item.requirements?.length || 0;
  const reqCompleted = item.requirements?.filter((r) => r.completed)?.length || 0;
  const completionPct = item.completionPercentage || (reqTotal > 0 ? Math.round((reqCompleted / reqTotal) * 100) : 0);

  return (
    <div
      onClick={() => navigate(`/responsibilities/${itemId}`)}
      className={`p-5 rounded-2xl bg-surface/70 border border-border/80 hover:border-primary-500/40 hover:bg-surface-hover/60 transition-all cursor-pointer shadow-sm relative group flex flex-col justify-between gap-4 ${priorityStyles.border}`}
    >
      {/* Top row: Category, Priority, and Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${categoryBadge.color}`}>
            {categoryBadge.label}
          </span>
          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${priorityStyles.badge}`}>
            {item.priority} ({item.priorityScore || 50})
          </span>
          {item.status === 'BLOCKED' && (
            <span className="px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
              <Ban className="w-3 h-3" />
              Blocked
            </span>
          )}
        </div>

        {/* Quick status dropdown */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <select
            value={item.status}
            disabled={updating}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-xs bg-surface-hover/80 border border-border rounded-lg px-2 py-1 text-foreground focus:outline-none focus:border-primary-500"
          >
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING">Waiting</option>
            <option value="BLOCKED">Blocked</option>
            <option value="COMPLETED">Completed</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            onClick={handleDelete}
            title="Delete"
            className="p-1 text-muted hover:text-rose-400 rounded hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Title & Description */}
      <div>
        <h3 className={`font-bold text-base text-foreground group-hover:text-primary-300 transition ${item.status === 'COMPLETED' ? 'line-through text-muted' : ''}`}>
          {item.title}
        </h3>
        {item.description && (
          <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      {/* Requirements Progress Bar (if any) */}
      {reqTotal > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-cyan-400" />
              Requirements ({reqCompleted}/{reqTotal})
            </span>
            <span className="font-semibold text-foreground">{completionPct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${completionPct === 100 ? 'bg-emerald-400' : completionPct >= 50 ? 'bg-primary-500' : 'bg-amber-400'}`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Missing items pill */}
      {item.missingRequirements && item.missingRequirements.length > 0 && (
        <div className="text-[11px] text-rose-400 flex items-center gap-1.5 bg-rose-500/5 px-2.5 py-1 rounded-lg border border-rose-500/15">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span className="truncate">Missing: {item.missingRequirements.join(', ')}</span>
        </div>
      )}

      {/* Footer info: Deadline countdown & Why */}
      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
        <div className="flex items-center gap-1 text-muted">
          <Clock className="w-3.5 h-3.5" />
          <span className={countdown.color}>{countdown.text}</span>
        </div>

        <div className="flex items-center gap-1 text-primary-400 font-semibold text-[11px] group-hover:translate-x-0.5 transition">
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
