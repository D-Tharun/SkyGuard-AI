import React, { useState, useEffect } from 'react';
import { Card, CardHeader } from '../components/common/Card';
import { CONTROLLED_BENCHMARK as MOCK_BENCHMARK } from '../data/mockData';
import { Info, Shield, CheckCircle2, Target, Zap, Activity, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { fetchPerformance } from '../services/api';

export const PerformancePage: React.FC = () => {
  const [benchmark, setBenchmark] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchPerformance()
      .then(data => {
        if (mounted) setBenchmark(data);
      })
      .catch(err => {
        console.error("Failed to fetch performance data", err);
        if (mounted) setError(true);
      });
    return () => { mounted = false; };
  }, []);

  if (error || !benchmark) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-8 text-center text-slate-500">
        {error ? "Backend connection lost. Benchmark data unavailable." : "Loading benchmark data..."}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Controlled Benchmark Evaluation
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Methodological metrics evaluated under controlled experimental test conditions
        </p>
      </div>

      {/* Controlled Benchmark Disclaimer Banner */}
      <div className="p-4 bg-slate-100 rounded-xl border border-slate-300 text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-slate-900 uppercase tracking-wide">
            CONTROLLED BENCHMARK EVALUATION
          </div>
          <p className="leading-relaxed">
            {benchmark.datasetDescription} These figures reflect controlled benchmark evaluation metrics comparing Conventional QC rules, ML-only models, and the Full SkyGuard framework.
          </p>
          <div className="text-[11px] text-slate-500 font-medium">
            * Note: Metrics reflect standardized controlled test benchmarks and are not presented as field performance or production accuracy.
          </div>
        </div>
      </div>

      {/* Primary Comparison Table */}
      <Card>
        <CardHeader
          title="CONTROLLED BENCHMARK COMPARISON"
          subtitle="Precision, Recall, F1 Score, and False Positive Rate across methodologies"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Methodology</th>
                <th className="py-3 px-4">Precision</th>
                <th className="py-3 px-4">Recall</th>
                <th className="py-3 px-4">F1 Score</th>
                <th className="py-3 px-4 text-right">False Positive Rate (FPR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {benchmark.models.map((m: any, idx: number) => {
                const isSkyGuard = m.name.includes('SkyGuard');
                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSkyGuard ? 'bg-blue-50/40 font-medium' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-normal">
                        {m.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {m.precision.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {m.recall.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {m.f1.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 text-right">
                      {m.fpr.toFixed(4)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Controlled Case Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-l-4 border-l-emerald-600">
          <CardHeader
            title="GENUINE EVENT PRESERVATION"
            subtitle="Controlled Benchmark"
          />
          <div className="p-5 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-800 font-mono">
                {benchmark.genuineEventPreservation?.gepr || '1.0000'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">GEPR</span>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
              <div className="font-bold">
                {benchmark.genuineEventPreservation?.observations || 483} Genuine-Event Observations
              </div>
              <div>
                {benchmark.genuineEventPreservation?.falseAlerts || 0} false alerts recorded during genuine event evaluation.
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {benchmark.genuineEventPreservation?.description || 'Demonstrates event preservation behavior under controlled test conditions without triggering false quality flags.'}
            </p>
          </div>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardHeader
            title="EVENT + FAULTY STATION CASES"
            subtitle="Controlled Benchmark"
          />
          <div className="p-5 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-blue-800 font-mono">
                {benchmark.eventAndFaultyStation?.accuracyPercent || '16.67%'}
              </span>
              <span className="text-xs text-slate-500 font-semibold">Accuracy</span>
            </div>
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200/80 text-xs text-blue-950 space-y-1">
              <div className="font-bold">
                {benchmark.eventAndFaultyStation?.controlledCases || 12} Controlled Cases
              </div>
              <div>
                {benchmark.eventAndFaultyStation?.correctlyDetected || 2} correctly detected during dual fault/event stress testing.
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {benchmark.eventAndFaultyStation?.description || 'Evaluates detection capabilities in severe compound scenarios where extreme weather coincides with hardware degradation.'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
