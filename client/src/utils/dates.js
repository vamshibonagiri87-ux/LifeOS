export function formatDate(dateString) {
  if (!dateString) return 'No deadline';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getDeadlineCountdown(dateString) {
  if (!dateString) return { text: 'No deadline', color: 'text-muted', isOverdue: false };
  const deadline = new Date(dateString);
  const now = new Date();
  const diffHours = (deadline - now) / (1000 * 60 * 60);

  if (diffHours < 0) {
    const overdueDays = Math.ceil(Math.abs(diffHours) / 24);
    return {
      text: `Overdue by ${overdueDays}d`,
      color: 'text-rose-500 font-semibold',
      badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      isOverdue: true,
    };
  }

  if (diffHours <= 24) {
    const hours = Math.round(diffHours);
    return {
      text: hours <= 1 ? 'Due within 1 hr' : `Due in ${hours} hrs`,
      color: 'text-rose-400 font-semibold',
      badgeClass: 'bg-rose-500/10 text-rose-300 border border-rose-500/20 animate-pulse',
      isOverdue: false,
    };
  }

  const days = Math.round(diffHours / 24);
  if (days <= 3) {
    return {
      text: `Due in ${days} days`,
      color: 'text-amber-400',
      badgeClass: 'bg-amber-500/10 text-amber-300 border border-amber-500/20',
      isOverdue: false,
    };
  }

  return {
    text: `Due in ${days} days`,
    color: 'text-slate-400',
    badgeClass: 'bg-slate-800/80 text-slate-300 border border-slate-700',
    isOverdue: false,
  };
}
