import React from 'react';
import { AssessmentDecision } from '../../types';
import { Check, AlertTriangle } from 'lucide-react';

interface WhyThisDecisionProps {
  decision: AssessmentDecision;
  customPoints?: string[];
  className?: string;
}

export const WhyThisDecision: React.FC<WhyThisDecisionProps> = ({
  decision,
  customPoints,
  className = '',
}) => {
  const defaultPoints: Record<AssessmentDecision, { type: 'check' | 'warn'; text: string }[]> = {
    NORMAL: [
      { type: 'check', text: 'Temperature is within expected local behaviour' },
      { type: 'check', text: 'Humidity and pressure are consistent' },
      { type: 'check', text: 'No significant temporal anomaly detected' },
    ],
    SENSOR_FAULT: [
      { type: 'check', text: 'Sudden rate-of-change anomaly' },
      { type: 'check', text: 'Other measured variables do not support the jump' },
      { type: 'check', text: 'Nearby observations remain normal' },
    ],
    GENUINE_EVENT: [
      { type: 'check', text: 'Persistent change over time' },
      { type: 'check', text: 'Other weather variables evolve consistently' },
      { type: 'check', text: 'Regional observations support the event' },
    ],
    UNCERTAIN: [
      { type: 'warn', text: 'Temporal evidence suggests an anomaly' },
      { type: 'warn', text: 'Other evidence supports a different interpretation' },
      { type: 'warn', text: 'Review recommended before taking automated action' },
    ],
  };

  const points = customPoints
    ? customPoints.map(t => ({
        type: (decision === 'UNCERTAIN' ? 'warn' : 'check') as 'check' | 'warn',
        text: t,
      }))
    : defaultPoints[decision];

  const headerColors: Record<AssessmentDecision, string> = {
    NORMAL: 'text-emerald-900',
    GENUINE_EVENT: 'text-blue-900',
    SENSOR_FAULT: 'text-rose-900',
    UNCERTAIN: 'text-amber-900',
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className={`text-sm font-bold tracking-tight ${headerColors[decision]}`}>
            WHY THIS DECISION?
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational meteorological reasoning in plain English
          </p>
        </div>
        <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
          Plain-English Validation
        </span>
      </div>

      <div className="space-y-2.5 pt-1">
        {points.map((pt, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-800">
            {pt.type === 'check' ? (
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
            )}
            <span className="leading-snug pt-0.5 font-normal text-slate-700">
              {pt.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
