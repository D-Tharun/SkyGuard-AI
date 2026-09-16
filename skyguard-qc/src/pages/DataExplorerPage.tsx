import React, { useState } from 'react';
import { Station, SensorReading } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatDateTime } from '../data/mockData';
import { fetchObservations } from '../services/api';
import { Download, ShieldCheck, Filter, ChevronRight, Info } from 'lucide-react';

interface DataExplorerPageProps {
  stations: Station[];
}

export const DataExplorerPage: React.FC<DataExplorerPageProps> = ({ stations }) => {
  const [selectedStationId, setSelectedStationId] = useState<string>('ALL');
  const [selectedDecision, setSelectedDecision] = useState<string>('ALL');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const [allReadings, setAllReadings] = React.useState<SensorReading[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    // Fetch last 150 records across all stations to act as our archival view
    fetchObservations(undefined, 150)
      .then(data => {
        if (mounted) {
          // Sort newest first
          setAllReadings(data.sort((a, b) => b.timestamp - a.timestamp));
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn("Explorer fetch failed", err);
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const filtered = allReadings.filter(r => {
    if (selectedStationId !== 'ALL' && r.stationId !== selectedStationId) return false;
    if (selectedDecision !== 'ALL' && r.decision !== selectedDecision) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = [
      'Timestamp',
      'Station ID',
      'Temperature (°C)',
      'Humidity (%)',
      'Pressure (hPa)',
      'Dew Point (°C)',
      'Decision State',
      'Quality Flag',
      'Reason',
      'Fusion Score',
    ];
    const rows = filtered.map(r => [
      formatDateTime(r.timestamp),
      r.stationId,
      r.temperature,
      r.humidity,
      r.pressure,
      r.dewPoint,
      r.decision,
      r.qualityFlag,
      `"${r.reason.replace(/"/g, '""')}"`,
      r.fusionScore,
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `skyguard_observations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Observation Data Explorer
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Archival records with quality-control diagnoses appended as metadata
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors self-start sm:self-auto shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Archival CSV</span>
        </button>
      </div>

      {/* Primary Principle Banner */}
      <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200/80 text-xs text-blue-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="font-bold text-blue-950">
            RAW OBSERVATION PRESERVATION PRINCIPLE
          </div>
          <p className="text-blue-900/90 leading-relaxed">
            Original automated sensor telemetry is permanently preserved in perpetuity. Quality flags, fault taxonomies, and operational decisions are appended as non-destructive metadata. Raw measurement series are never overwritten or deleted.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label htmlFor="explorer-station-select" className="text-xs font-semibold text-slate-600">Station:</label>
              <select
                id="explorer-station-select"
                value={selectedStationId}
                onChange={e => setSelectedStationId(e.target.value)}
                className="text-xs font-medium bg-white border border-slate-200 rounded-md px-2.5 py-1 text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Stations</option>
                {stations.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.id} ({st.location})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <label htmlFor="explorer-decision-select" className="text-xs font-semibold text-slate-600">Decision:</label>
              <select
                id="explorer-decision-select"
                value={selectedDecision}
                onChange={e => setSelectedDecision(e.target.value)}
                className="text-xs font-medium bg-white border border-slate-200 rounded-md px-2.5 py-1 text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Decisions</option>
                <option value="NORMAL">NORMAL</option>
                <option value="GENUINE_EVENT">GENUINE EVENT</option>
                <option value="SENSOR_FAULT">SENSOR FAULT</option>
                <option value="UNCERTAIN">UNCERTAIN</option>
              </select>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-500">
            Showing {filtered.length} observations
          </div>
        </div>
      </Card>

      {/* Primary Observations Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Station</th>
                <th className="py-3 px-4">Temperature</th>
                <th className="py-3 px-4">Humidity</th>
                <th className="py-3 px-4">Pressure</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Reason / Evidence</th>
                <th className="py-3 px-4 text-right">Evidence Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((r, idx) => {
                const isExpanded = expandedRow === idx;
                return (
                  <React.Fragment key={idx}>
                    <tr
                      className={`hover:bg-slate-50 transition-colors ${
                        r.decision === 'SENSOR_FAULT'
                          ? 'bg-rose-50/20'
                          : r.decision === 'GENUINE_EVENT'
                          ? 'bg-blue-50/20'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateTime(r.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {r.stationId}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {r.temperature.toFixed(1)} °C
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {r.humidity} %
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {r.pressure} hPa
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge type="decision" value={r.decision} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {r.reason}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setExpandedRow(isExpanded ? null : idx)}
                          className="font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Hide' : 'Evidence'}</span>
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          />
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Technical Evidence Layer */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <td colSpan={8} className="p-4">
                          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between text-xs pb-2 border-b border-slate-100">
                              <span className="font-bold text-slate-800">
                                TECHNICAL EVIDENCE BREAKDOWN FOR RECORD #{idx + 1}
                              </span>
                              <span className="font-mono text-slate-500">
                                Dew Point: {r.dewPoint} °C · VPD: {r.vpd} kPa · Technical Flag: {r.qualityFlag}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-mono">
                              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                <span className="text-[10px] text-slate-400 block font-sans">Edge QC</span>
                                <strong>{r.edgeScore.toFixed(2)}</strong>
                              </div>
                              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                <span className="text-[10px] text-slate-400 block font-sans">Temporal ML</span>
                                <strong>{r.temporalScore.toFixed(2)}</strong>
                              </div>
                              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                <span className="text-[10px] text-slate-400 block font-sans">Multivariate</span>
                                <strong>{r.multivariateScore.toFixed(2)}</strong>
                              </div>
                              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                <span className="text-[10px] text-slate-400 block font-sans">Physics</span>
                                <strong>{r.physicsScore.toFixed(2)}</strong>
                              </div>
                              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                <span className="text-[10px] text-slate-400 block font-sans">Context</span>
                                <strong>{r.contextScore.toFixed(2)}</strong>
                              </div>
                              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                                <span className="text-[10px] text-slate-400 block font-sans">Fusion Index</span>
                                <strong className="text-blue-700">{r.fusionScore.toFixed(2)}</strong>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-600 italic">
                              Diagnosis: {r.diagnosis}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
