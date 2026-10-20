import React from 'react';

const STAGE_STYLES = {
  APPLIED: {
    label: 'Applied',
    badge: 'bg-sky-50 text-sky-700 border-sky-200/80',
    dot: 'bg-sky-500',
  },
  SCREENING: {
    label: 'Screening',
    badge: 'bg-purple-50 text-purple-700 border-purple-200/80',
    dot: 'bg-purple-500',
  },
  INTERVIEW: {
    label: 'Interview',
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500',
  },
  OFFER: {
    label: 'Offer',
    badge: 'bg-teal-50 text-teal-700 border-teal-200/80',
    dot: 'bg-teal-500',
  },
  HIRED: {
    label: 'Hired',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  REJECTED: {
    label: 'Rejected',
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500',
  },
};

export const STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

export function Badge({ stage, className = '', showDot = true, size = 'sm' }) {
  const config = STAGE_STYLES[stage] || {
    label: stage || 'Unknown',
    badge: 'bg-slate-50 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  const sizeClasses = size === 'xs' 
    ? 'px-2 py-0.5 text-xs' 
    : size === 'md' 
    ? 'px-3 py-1 text-sm' 
    : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full shrink-0 ${config.badge} ${sizeClasses} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {config.label}
    </span>
  );
}

export default Badge;
