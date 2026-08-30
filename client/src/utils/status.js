export function getStatusBadge(status) {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'Completed',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
        dotClass: 'bg-emerald-400',
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
        dotClass: 'bg-blue-400 animate-pulse',
      };
    case 'BLOCKED':
      return {
        label: 'Blocked',
        badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
        dotClass: 'bg-rose-400',
      };
    case 'WAITING':
      return {
        label: 'Waiting',
        badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        dotClass: 'bg-amber-400',
      };
    case 'OVERDUE':
      return {
        label: 'Overdue',
        badgeClass: 'bg-rose-600/20 text-rose-300 border border-rose-500/40',
        dotClass: 'bg-rose-500',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        badgeClass: 'bg-slate-700 text-slate-400 border border-slate-600',
        dotClass: 'bg-slate-500',
      };
    case 'NOT_STARTED':
    default:
      return {
        label: 'Not Started',
        badgeClass: 'bg-slate-800 text-slate-300 border border-slate-700',
        dotClass: 'bg-slate-400',
      };
  }
}
