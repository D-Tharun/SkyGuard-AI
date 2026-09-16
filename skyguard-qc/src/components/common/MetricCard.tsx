import React from 'react';
import { useAnimatedNumber } from '../../utils/motion';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaType?: 'positive' | 'negative' | 'neutral';
  status?: string;
  statusVariant?: 'normal' | 'warning' | 'alert' | 'neutral';
  icon?: React.ReactNode;
  id?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  delta,
  deltaType = 'neutral',
  status,
  statusVariant = 'neutral',
  icon,
  id,
}) => {
  // Check if value is numeric or has percentage
  const isPercent = typeof value === 'string' && value.endsWith('%');
  const rawNum = typeof value === 'number' ? value : parseFloat(value);
  const isNumeric = !isNaN(rawNum);
  const decimals = typeof value === 'string' && value.includes('.') ? 1 : typeof value === 'number' && !Number.isInteger(value) ? 1 : 0;

  const animatedNum = useAnimatedNumber(isNumeric ? rawNum : value, decimals, 350);

  const displayValue = isNumeric
    ? isPercent
      ? `${animatedNum}%`
      : animatedNum
    : value;

  const statusBadgeClasses = {
    normal: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    alert: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  }[statusVariant];

  return (
    <div
      id={id}
      className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-all duration-150"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-500 tracking-tight flex items-center gap-1.5">
          {icon && <span className="text-slate-400">{icon}</span>}
          {title}
        </span>
        {status && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border transition-colors duration-150 ${statusBadgeClasses}`}>
            {status}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-numeric tabular-nums">
          {displayValue}
        </span>
        {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
      </div>

      {delta && (
        <div className="mt-2 text-xs font-normal text-slate-500">
          <span
            className={
              deltaType === 'positive'
                ? 'text-slate-600 font-medium'
                : deltaType === 'negative'
                ? 'text-slate-600 font-medium'
                : 'text-slate-500'
            }
          >
            {delta}
          </span>
        </div>
      )}
    </div>
  );
};
