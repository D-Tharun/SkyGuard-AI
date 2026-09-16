import React, { useState } from 'react';
import { AnomalyAlert, AssessmentDecision, FaultType } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { timeAgo, formatDateTime } from '../data/mockData';
import { Filter, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AlertsPageProps {
  alerts: AnomalyAlert[];
  onSelectAlert: (alert: AnomalyAlert) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ alerts, onSelectAlert }) => {
  const [decisionFilter, setDecisionFilter] = useState<'ALL' | AssessmentDecision>('ALL');
  const [faultFilter, setFaultFilter] = useState<string>('ALL');

  const faultTypes: FaultType[] = [
    'Spike / Transient',
    'Frozen / Stuck',
    'Drift / Bias',
    'Communication / Data Integrity',
    'Multivariate Inconsistency',
    'Range / Plausibility Violation',
  ];

  const filtered = alerts.filter(a => {
    if (decisionFilter !== 'ALL' && a.decision !== decisionFilter) return false;
    if (faultFilter !== 'ALL' && a.faultType !== faultFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Observation Quality Alerts & Triage
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Decisions prioritized: Sensor Faults vs Genuine Meteorological Events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Active Alerts:</span>
          <span className="text-xs font-bold font-mono px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200">
            {alerts.filter(a => a.status === 'active').length}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          {/* Decision State Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Decision:
            </span>
            {(['ALL', 'SENSOR_FAULT', 'GENUINE_EVENT', 'UNCERTAIN'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDecisionFilter(d)}
                className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors ${
                  decisionFilter === d
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {d === 'ALL'
                  ? 'All Decisions'
                  : d === 'SENSOR_FAULT'
                  ? 'Sensor Fault'
                  : d === 'GENUINE_EVENT'
                  ? 'Genuine Weather Event'
                  : 'Uncertain'}
              </button>
            ))}
          </div>

          {/* Fault Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={faultFilter}
              onChange={e => setFaultFilter(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-200 rounded-md px-2.5 py-1 text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Fault Classes</option>
              {faultTypes.map(ft => (
                <option key={ft} value={ft}>
                  {ft}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Alerts Feed (Decision First!) */}
      <div className="space-y-3">
        {filtered.map(alert => (
          <div
            key={alert.id}
            onClick={() => onSelectAlert(alert)}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2 max-w-3xl">
              {/* Line 1: Decision FIRST! */}
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge type="decision" value={alert.decision} size="md" />
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {alert.stationId}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-xs font-medium text-slate-700">
                  {alert.location}
                </span>
                <span className="text-slate-300">·</span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {timeAgo(alert.detectedAt)}
                </span>
              </div>

              {/* Line 2: Headline */}
              <div className="text-base font-bold text-slate-900">
                {alert.headline}
              </div>

              {/* Line 3: Summary text */}
              <p className="text-xs text-slate-600 leading-relaxed">
                {alert.summary}
              </p>

              {/* Line 4: Fault Classification & Action */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                <span>
                  Classification: <strong className="text-slate-700">{alert.faultType}</strong>
                </span>
                <span>·</span>
                <span>
                  Action: <span className="text-slate-700 font-medium">{alert.recommendedAction}</span>
                </span>
              </div>
            </div>

            {/* Right: Technical Scores (Secondary) */}
            <div className="flex items-center gap-5 self-end md:self-auto flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-between md:justify-end">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Evidence Score
                </div>
                <div className="text-sm font-mono font-bold text-slate-800">
                  {alert.fusionScore.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400">
                  {alert.confidencePercent}% confidence
                </div>
              </div>

              <button className="px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5">
                <span>Inspect Evidence</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-12 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
            No alerts found matching the current filters.
          </div>
        )}
      </div>
    </div>
  );
};
