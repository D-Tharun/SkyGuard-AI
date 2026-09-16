import React from 'react';
import { AssessmentDecision } from '../../types';
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DecisionCardProps {
  decision: AssessmentDecision;
  stationName: string;
  stationId: string;
  readingDisplay: string;
  readingMetric?: string;
  summary: string;
  technicalQualityFlag?: 'PASS' | 'SUSPECT' | 'FAIL';
  onInspectDetails?: () => void;
  onSelectStation?: (stationId: string) => void;
}

export const DecisionCard: React.FC<DecisionCardProps> = ({
  decision,
  stationName,
  stationId,
  readingDisplay,
  readingMetric = 'Temperature',
  summary,
  technicalQualityFlag = 'PASS',
  onInspectDetails,
}) => {
  const configs: Record<AssessmentDecision, {
    title: string;
    containerClass: string;
    borderAccent: string;
    titleColor: string;
    icon: React.ReactNode;
    sublabel: string;
    badgeBg: string;
  }> = {
    NORMAL: {
      title: 'NORMAL',
      containerClass: 'bg-white border-emerald-200/90',
      borderAccent: 'border-l-4 border-l-emerald-600',
      titleColor: 'text-emerald-800',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />,
      sublabel: 'Observation verified — conforms to meteorological bounds',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    GENUINE_EVENT: {
      title: 'GENUINE EXTREME WEATHER EVENT',
      containerClass: 'bg-white border-blue-200/90',
      borderAccent: 'border-l-4 border-l-blue-600',
      titleColor: 'text-blue-800',
      icon: <AlertOctagon className="w-6 h-6 text-blue-600 flex-shrink-0" />,
      sublabel: 'Genuine atmospheric extreme — supported by multi-modal evidence',
      badgeBg: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    SENSOR_FAULT: {
      title: 'SENSOR / DATA FAULT',
      containerClass: 'bg-white border-rose-200/90',
      borderAccent: 'border-l-4 border-l-rose-600',
      titleColor: 'text-rose-800',
      icon: <AlertTriangle className="w-6 h-6 text-rose-600 flex-shrink-0" />,
      sublabel: 'Abnormal reading attributed to instrument error or telemetry corruption',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
    },
    UNCERTAIN: {
      title: 'UNCERTAIN — REVIEW',
      containerClass: 'bg-white border-amber-200/90',
      borderAccent: 'border-l-4 border-l-amber-600',
      titleColor: 'text-amber-800',
      icon: <HelpCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />,
      sublabel: 'Ambiguous observation — conflicting evidence layers require operator verification',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    },
  };

  const current = configs[decision];

  return (
    <div
      className={`rounded-xl border shadow-xs p-5 md:p-6 ${current.containerClass} ${current.borderAccent} transition-all duration-200`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            CURRENT ASSESSMENT
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500 font-medium">
            Primary Decision State
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            Technical State:
          </span>
          <span
            className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border transition-colors duration-150 ${
              technicalQualityFlag === 'PASS'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : technicalQualityFlag === 'SUSPECT'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {technicalQualityFlag}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={decision}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="space-y-1"
          >
            <div className="flex items-center gap-2.5">
              {current.icon}
              <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${current.titleColor}`}>
                {current.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 pl-8">
              {current.sublabel}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-4 py-2.5 flex items-center gap-4 self-start md:self-auto transition-all duration-150">
          <div>
            <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              Station
            </div>
            <div className="text-sm font-bold text-slate-800">
              {stationName}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {stationId}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              {readingMetric}
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono tabular-nums">
              {readingDisplay}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
          "{summary}"
        </p>

        {onInspectDetails && (
          <button
            onClick={onInspectDetails}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline flex-shrink-0 self-end sm:self-auto transition-colors"
          >
            <span>Inspect Evidence & Action</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
