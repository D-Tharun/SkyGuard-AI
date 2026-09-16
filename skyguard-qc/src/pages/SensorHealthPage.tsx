import React from 'react';
import { Station } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { HeartPulse, Wrench, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface SensorHealthPageProps {
  stations: Station[];
  onSelectStation: (stationId: string) => void;
}

export const SensorHealthPage: React.FC<SensorHealthPageProps> = ({ stations, onSelectStation }) => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Sensor Health & Maintenance Index
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Progressive degradation indicators for automated weather station instrument clusters
        </p>
      </div>

      {/* Engineering Maintenance Disclaimer */}
      <div className="p-4 bg-slate-100 rounded-xl border border-slate-300 text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-slate-900">
            MAINTENANCE DEGRADATION TRACKER
          </div>
          <p className="mt-0.5 leading-relaxed">
            The Sensor Health Index is an operational maintenance indicator computed from drift persistence, noise variance, and thermodynamic inconsistency over 7-to-30 day rolling horizons. It indicates when physical calibration or inspection is warranted; it does not claim to predict exact component failure dates.
          </p>
        </div>
      </div>

      {/* Grid of Station Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.map(st => {
          const isAlert = st.healthScore < 70 && st.status !== 'Offline';
          const isWarning = st.healthScore >= 70 && st.healthScore < 85;
          const isHealthy = st.healthScore >= 85;
          const isOffline = st.status === 'Offline';

          return (
            <Card key={st.id} className="p-5 flex flex-col justify-between space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-slate-400">
                      {st.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {st.name}
                    </h3>
                    <div className="text-[11px] text-slate-500">{st.state}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black font-mono text-slate-900">
                      {isOffline ? '0' : st.healthScore}
                      <span className="text-xs text-slate-400 font-normal">/100</span>
                    </div>
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        isOffline
                          ? 'bg-slate-100 text-slate-500'
                          : isHealthy
                          ? 'bg-emerald-50 text-emerald-700'
                          : isWarning
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {isOffline
                        ? 'Offline'
                        : isHealthy
                        ? 'Nominal Health'
                        : isWarning
                        ? 'Minor Concerns'
                        : 'Inspection Req.'}
                    </span>
                  </div>
                </div>

                {/* Mini 7-day sparkline bar simulation */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Recent 7-Day Trend:</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {isHealthy ? 'Stable (±0.02°C)' : isWarning ? 'Drifting (-0.05°C/d)' : 'High variance'}
                    </span>
                  </div>
                  <div className="flex items-end gap-1 h-7 pt-1">
                    {[95, 94, 96, 92, 90, 88, st.healthScore].map((val, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 rounded-xs transition-all ${
                          val >= 85
                            ? 'bg-emerald-400'
                            : val >= 70
                            ? 'bg-amber-400'
                            : 'bg-rose-400'
                        }`}
                        style={{ height: `${Math.max(15, (val / 100) * 100)}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Telemetry Breakdown Checklist */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between py-0.5 border-b border-slate-50">
                    <span className="text-slate-500">Anomaly frequency:</span>
                    <span className="font-medium text-slate-800">
                      {st.activeAnomalies > 0 ? `${st.activeAnomalies} active event` : 'None in 7d'}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-50">
                    <span className="text-slate-500">Drift magnitude:</span>
                    <span className="font-medium text-slate-800">
                      {st.id === 'New_Delhi_Safdarjung' || st.id === 'AWS-07' ? '-1.8 °C cumulative' : '< 0.1 °C'}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-50">
                    <span className="text-slate-500">Persistence rate:</span>
                    <span className="font-medium text-slate-800">
                      {st.id === 'Chennai_Meenambakkam' || st.id === 'AWS-03' ? 'Transient (1 interval)' : 'Baseline stable'}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-50">
                    <span className="text-slate-500">Physics consistency:</span>
                    <span className="font-medium text-slate-800">
                      {isHealthy ? 'Thermally aligned' : isWarning ? 'Slight deviation' : 'Thermodynamic mismatch'}
                    </span>
                  </div>
                  <div className="flex justify-between py-0.5 border-b border-slate-50">
                    <span className="text-slate-500">Missing packet rate:</span>
                    <span className="font-medium text-slate-800">
                      {isOffline ? 'Offline / Timed out' : 'Nominal (< 0.1%)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Recommendation */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Recommendation
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  {isHealthy && '✓ Operational. Continue routine 90-day maintenance interval.'}
                  {isWarning && '⚠ Schedule calibration review within 14 days to correct baseline offset.'}
                  {isAlert && '⚠ Inspect sensor wiring harness & contact terminal immediately.'}
                  {isOffline && '⚠ Dispatch site engineering team to restore field power and cellular uplink.'}
                </div>

                <button
                  onClick={() => onSelectStation(st.id)}
                  className="w-full mt-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                >
                  View Station Historical Records →
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
