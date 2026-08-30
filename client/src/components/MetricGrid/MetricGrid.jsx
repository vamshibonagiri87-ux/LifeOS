import React from 'react';
import { CheckSquare, AlertTriangle, Calendar, Ban, FileWarning, CheckCircle2 } from 'lucide-react';

export function MetricGrid({ metrics = {} }) {
  const cards = [
    {
      label: 'Active Obligations',
      value: metrics.activeResponsibilities || 0,
      icon: CheckSquare,
      color: 'text-primary-400',
      bg: 'bg-primary-500/10',
      border: 'border-primary-500/20',
    },
    {
      label: 'Critical Priority',
      value: metrics.critical || 0,
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
    {
      label: 'Due This Week',
      value: metrics.dueThisWeek || 0,
      icon: Calendar,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Blocked Obligations',
      value: metrics.blocked || 0,
      icon: Ban,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
    {
      label: 'Missing Requirements',
      value: metrics.missingRequirements || 0,
      icon: FileWarning,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    {
      label: 'Completed Recently',
      value: metrics.completedThisWeek || 0,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-surface/60 border border-border/80 backdrop-blur-md flex flex-col justify-between transition hover:border-border hover:bg-surface-hover/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted truncate">{card.label}</span>
              <div className={`p-1.5 rounded-lg ${card.bg} ${card.color} border ${card.border}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-foreground">{card.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
