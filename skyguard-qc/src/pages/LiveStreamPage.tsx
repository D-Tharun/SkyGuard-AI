import React, { useState, useEffect } from 'react';
import { Station, SensorReading } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { SensorChart } from '../components/common/SensorChart';
import { StatusBadge } from '../components/common/StatusBadge';
import { formatTime } from '../data/mockData';
import { fetchObservations } from '../services/api';
import { Play, Pause, Activity, Radio } from 'lucide-react';

interface LiveStreamPageProps {
  stations: Station[];
}

export const LiveStreamPage: React.FC<LiveStreamPageProps> = ({ stations }) => {
  const [selectedStationId, setSelectedStationId] = useState<string>('Bengaluru_HAL');
  const [isStreaming, setIsStreaming] = useState(true);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLive = async (station: string) => {
    try {
      const data = await fetchObservations(station, 50);
      setReadings(data);
      setError(null);
    } catch (err) {
      console.warn("Live stream fetch failed", err);
      setError("Backend unavailable");
    }
  };

  useEffect(() => {
    fetchLive(selectedStationId);
  }, [selectedStationId]);

  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      fetchLive(selectedStationId);
    }, 3000);
    return () => clearInterval(interval);
  }, [isStreaming, selectedStationId]);

  const latest = readings[readings.length - 1];
  const station = stations.find(s => s.id === selectedStationId) || stations[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Live Telemetry Stream
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous automated weather station observation feed with real-time QC evaluation
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <select
            value={selectedStationId}
            onChange={e => setSelectedStationId(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none"
          >
            {stations.map(st => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              isStreaming
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume Stream</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stream Status Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            {isStreaming && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isStreaming ? 'bg-blue-600' : 'bg-slate-400'
              }`}
            />
          </span>
          <div>
            <div className="text-xs font-bold text-slate-900">
              {isStreaming ? 'STREAM ACTIVE · 3s POLLING' : 'STREAM PAUSED'}
            </div>
            <div className="text-[11px] text-slate-500">
              Station: {station.location} ({station.id}) · Model: {station.sensorModel}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Temp</span>
            <strong className="text-slate-900">{latest?.temperature?.toFixed(1) || '—'} °C</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Humidity</span>
            <strong className="text-slate-900">{latest?.humidity} %</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Pressure</span>
            <strong className="text-slate-900">{latest?.pressure} hPa</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Quality</span>
            <StatusBadge type="decision" value={latest?.decision || 'NORMAL'} size="sm" />
          </div>
        </div>
      </div>

      {/* Main Single-Variable Chart */}
      <SensorChart readings={readings} />

      {/* Incoming Observations Log Buffer */}
      <Card>
        <CardHeader
          title="INCOMING TELEMETRY BUFFER"
          subtitle="Recent 10 observations with real-time QC evaluation"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Station</th>
                <th className="py-2.5 px-4">Temp (°C)</th>
                <th className="py-2.5 px-4">Humidity (%)</th>
                <th className="py-2.5 px-4">Pressure (hPa)</th>
                <th className="py-2.5 px-4">QC Assessment</th>
                <th className="py-2.5 px-4">Diagnosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {[...readings].reverse().slice(0, 10).map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono text-slate-500">
                    {formatTime(r.timestamp)}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                    {r.stationId}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">
                    {r.temperature.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">
                    {r.humidity}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">
                    {r.pressure}
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge type="decision" value={r.decision} size="sm" />
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 max-w-sm truncate">
                    {r.diagnosis}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
