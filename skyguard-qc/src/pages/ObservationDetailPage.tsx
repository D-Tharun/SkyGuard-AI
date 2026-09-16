import React, { useState } from 'react';
import { AnomalyAlert, PageId } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { formatDateTime } from '../data/mockData';

interface ObservationDetailPageProps {
  alert: AnomalyAlert;
  onBack: () => void;
  onNavigateToStation: (stationId: string) => void;
}

export const ObservationDetailPage: React.FC<ObservationDetailPageProps> = ({
  alert,
  onBack,
  onNavigateToStation,
}) => {
  const [markedReviewed, setMarkedReviewed] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb / Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Alerts & Observations</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Record ID:</span>
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            {alert.id}
          </span>
        </div>
      </div>

      {/* Primary Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <StatusBadge type="decision" value={alert.decision} size="lg" />
            <span className="text-xs font-mono font-semibold text-slate-500">
              {alert.stationId}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {alert.headline}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Station: {alert.stationName} ({alert.location}) · Logged at {formatDateTime(alert.detectedAt)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setMarkedReviewed(true)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all inline-flex items-center gap-1.5 ${
              markedReviewed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
            }`}
          >
            {markedReviewed ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Reviewed by Operator</span>
              </>
            ) : (
              <span>Mark as Reviewed</span>
            )}
          </button>

          <button
            onClick={() => onNavigateToStation(alert.stationId)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Station Profile
          </button>
        </div>
      </div>

      {/* 1. WHAT HAPPENED? & 2. TIMELINE */}
      <Card>
        <CardHeader
          title="1. WHAT HAPPENED?"
          subtitle="Sequential observation readings surrounding the event window"
        />
        <div className="p-5 md:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-3 py-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
            {alert.observedSequence.map((seq, idx) => (
              <React.Fragment key={idx}>
                <div
                  className={`px-4 py-3 rounded-lg text-center min-w-[90px] border ${
                    seq.abnormal
                      ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200/60'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div
                    className={`text-lg md:text-xl font-mono font-bold ${
                      seq.abnormal ? 'text-rose-700' : 'text-slate-900'
                    }`}
                  >
                    {seq.value.toFixed(1)} °C
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {seq.time}
                  </div>
                  {seq.abnormal && (
                    <span className="inline-block text-[10px] font-bold text-rose-700 uppercase tracking-wider mt-1">
                      Flagged Abnormal
                    </span>
                  )}
                </div>
                {idx < alert.observedSequence.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="text-xs text-slate-600 leading-relaxed">
            Observation sequence indicates a sudden step from baseline (32–33 °C) directly to <strong>{alert.triggerValue}</strong> followed by instantaneous return to expected trajectory.
          </div>
        </div>
      </Card>

      {/* 3. WHY WAS THIS FLAGGED? */}
      <Card>
        <CardHeader
          title="2. WHY WAS THIS FLAGGED?"
          subtitle="Human-readable operational meteorological rationale"
        />
        <div className="p-5 md:p-6 space-y-3">
          <p className="text-sm text-slate-800 leading-relaxed font-normal">
            {alert.summary}
          </p>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            Atmospheric air masses have substantial thermal inertia. Natural ambient air cannot heat or cool by +22 °C within 2 seconds without massive radiant flux that would simultaneously perturb barometric pressure and vapor density.
          </div>
        </div>
      </Card>

      {/* 4. SUPPORTING EVIDENCE */}
      <Card>
        <CardHeader
          title="3. SUPPORTING EVIDENCE"
          subtitle="Multi-modal consistency cross-verification"
        />
        <div className="p-5 md:p-6 space-y-2.5">
          {alert.evidencePoints.map((pt, i) => (
            <div key={i} className="flex items-start gap-2.5 text-xs text-slate-800">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
              <span className="leading-normal pt-0.5">{pt}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. DECISION & 6. RECOMMENDED ACTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-l-4 border-l-rose-600">
          <CardHeader title="4. OPERATIONAL DECISION" subtitle="Quality Control Conclusion" />
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <StatusBadge type="decision" value={alert.decision} size="lg" />
              <span className="text-xs text-slate-500 font-mono font-medium">
                (Technical: FAIL)
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Confidence level: <strong>{alert.confidencePercent}%</strong>. The observation has been quarantined from downstream forecast models while raw telemetry is preserved in archive.
            </p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader title="5. RECOMMENDED ACTION" subtitle="Field Maintenance & Engineering Protocol" />
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>Recommended Maintenance</span>
            </div>
            <div className="p-3 bg-blue-50/50 border border-blue-200/80 rounded-lg text-xs text-slate-800 leading-relaxed">
              {alert.recommendedAction}
            </div>
          </div>
        </Card>
      </div>

      {/* TECHNICAL FEATURE CONTRIBUTION */}
      <Card>
        <CardHeader
          title="TECHNICAL FEATURE CONTRIBUTION"
          subtitle="Quantitative attribution weights across detection features"
        />
        <div className="p-5 space-y-4">
          <div className="space-y-3">
            {alert.featureContributions.map((fc, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{fc.feature}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">{fc.impact} Contribution</span>
                    <span className="font-mono font-bold text-slate-900">{fc.score.toFixed(2)}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-slate-700 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, fc.score * 200)}%` }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-slate-500 italic border-t border-slate-100">
            Note: Feature contribution scores reflect calibrated attribution metrics derived from temporal autoencoder reconstruction residuals and multivariate thermodynamic constraints.
          </div>
        </div>
      </Card>
    </div>
  );
};
