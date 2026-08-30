export function getPriorityStyles(priority) {
  switch (priority) {
    case 'CRITICAL':
      return {
        badge: 'bg-rose-500/15 text-rose-400 border border-rose-500/30 glow-critical',
        border: 'border-l-4 border-l-rose-500',
        text: 'text-rose-400',
        bg: 'bg-rose-500',
      };
    case 'HIGH':
      return {
        badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        border: 'border-l-4 border-l-amber-500',
        text: 'text-amber-400',
        bg: 'bg-amber-500',
      };
    case 'MEDIUM':
      return {
        badge: 'bg-primary-500/15 text-primary-300 border border-primary-500/30',
        border: 'border-l-4 border-l-primary-500',
        text: 'text-primary-400',
        bg: 'bg-primary-500',
      };
    case 'LOW':
    default:
      return {
        badge: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
        border: 'border-l-4 border-l-slate-500',
        text: 'text-slate-400',
        bg: 'bg-slate-500',
      };
  }
}

export function getCategoryBadge(category) {
  const map = {
    EDUCATION: { label: 'Education', icon: 'GraduationCap', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    WORK: { label: 'Work', icon: 'Briefcase', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    FINANCE: { label: 'Finance', icon: 'DollarSign', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    PERSONAL: { label: 'Personal', icon: 'User', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
    HEALTH: { label: 'Health', icon: 'HeartPulse', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    GOVERNMENT: { label: 'Government', icon: 'Landmark', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    TRAVEL: { label: 'Travel', icon: 'Plane', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
    SHOPPING: { label: 'Shopping', icon: 'ShoppingBag', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
    OTHER: { label: 'Other', icon: 'Folder', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
  };
  return map[category] || map.OTHER;
}
