import React from 'react';
import { AssessmentDecision, QualityFlag, StationStatus } from '../../types';

interface StatusBadgeProps {
  type: 'decision' | 'quality' | 'station';
  value: AssessmentDecision | QualityFlag | StationStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type,
  value,
  size = 'md',
  showDot = true,
  className = '',
}) => {
  let label = String(value);
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';

  if (type === 'decision') {
    switch (value) {
      case 'NORMAL':
        label = 'NORMAL';
        colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
        dotColor = 'bg-emerald-500';
        break;
      case 'GENUINE_EVENT':
        label = 'GENUINE WEATHER EVENT';
        colorClasses = 'bg-blue-50 text-blue-800 border-blue-200/80';
        dotColor = 'bg-blue-500';
        break;
      case 'SENSOR_FAULT':
        label = 'SENSOR FAULT';
        colorClasses = 'bg-rose-50 text-rose-800 border-rose-200/80';
        dotColor = 'bg-rose-500';
        break;
      case 'UNCERTAIN':
        label = 'UNCERTAIN — REVIEW';
        colorClasses = 'bg-amber-50 text-amber-800 border-amber-200/80';
        dotColor = 'bg-amber-500';
        break;
    }
  } else if (type === 'quality') {
    switch (value) {
      case 'PASS':
        label = 'PASS';
        colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        dotColor = 'bg-emerald-500';
        break;
      case 'SUSPECT':
        label = 'SUSPECT';
        colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
        dotColor = 'bg-amber-500';
        break;
      case 'FAIL':
        label = 'FAIL';
        colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
        dotColor = 'bg-rose-500';
        break;
    }
  } else if (type === 'station') {
    switch (value) {
      case 'Online':
        colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
        dotColor = 'bg-emerald-500';
        break;
      case 'Warning':
        colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
        dotColor = 'bg-amber-500';
        break;
      case 'Alert':
        colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
        dotColor = 'bg-rose-500';
        break;
      case 'Offline':
        colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
        dotColor = 'bg-slate-400';
        break;
    }
  }

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-xs px-3 py-1.5 font-semibold tracking-wide',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${colorClasses} ${sizeStyles[size]} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />}
      <span className="whitespace-nowrap">{label}</span>
    </span>
  );
};
