import React, { useState } from 'react';
import { Station } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { Search, Eye, MapPin } from 'lucide-react';
import { timeAgo } from '../data/mockData';

interface StationsPageProps {
  stations: Station[];
  onSelectStation: (stationId: string) => void;
}

export const StationsPage: React.FC<StationsPageProps> = ({ stations, onSelectStation }) => {
  const [search, setSearch] = useState('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(stations[1] || stations[0]);

  const filtered = stations.filter(
    s =>
      s.location.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.state.toLowerCase().includes(search.toLowerCase())
  );

  const onlineCount = stations.filter(s => s.status === 'Online').length;
  const warningCount = stations.filter(s => s.status === 'Warning').length;
  const alertCount = stations.filter(s => s.status === 'Alert').length;
  const offlineCount = stations.filter(s => s.status === 'Offline').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            Weather Station Network
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic distribution & operational status of automated weather stations
          </p>
        </div>

        {/* Network status summary pill */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Online: <strong>{onlineCount}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Under review: <strong>{warningCount}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Faults: <strong>{alertCount}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Offline: <strong>{offlineCount}</strong>
          </span>
        </div>
      </div>

      {/* Map Card */}
      <Card className="overflow-hidden">
        <CardHeader
          title="GEOGRAPHIC OBSERVATION MAP"
          subtitle="Click any station marker for telemetry preview and operational state"
          action={
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search stations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-44"
              />
            </div>
          }
        />

        <div className="relative h-80 md:h-96 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
          {/* Subtle India Geographic Outline SVG */}
          <svg viewBox="0 0 500 550" className="w-full h-full max-h-96 opacity-40 select-none">
            <path
              d="M180 40 L230 30 L280 50 L320 80 L340 130 L360 180 L370 240 L350 300 L330 360 L290 420 L250 470 L210 500 L180 480 L150 430 L120 370 L100 300 L90 240 L100 180 L130 120 L160 70 Z"
              fill="#E2E8F0"
              stroke="#CBD5E1"
              strokeWidth="2"
            />
          </svg>

          {/* Station Markers */}
          {filtered.map(st => {
            const x = ((st.lng - 68) / (97 - 68)) * 80 + 10;
            const y = ((37 - st.lat) / (37 - 8)) * 80 + 10;
            const isSelected = selectedStation?.id === st.id;

            const markerBg = {
              NORMAL: 'bg-emerald-500 ring-emerald-200',
              GENUINE_EVENT: 'bg-blue-600 ring-blue-200',
              SENSOR_FAULT: 'bg-rose-500 ring-rose-200',
              UNCERTAIN: 'bg-amber-500 ring-amber-200',
            }[st.currentDecision];

            return (
              <button
                key={st.id}
                onClick={() => setSelectedStation(st)}
                style={{ left: `${x}%`, top: `${y}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 group z-20 focus:outline-none`}
                title={`${st.id} — ${st.location}`}
              >
                <span
                  className={`block w-3.5 h-3.5 rounded-full ring-4 shadow-xs transition-transform ${markerBg} ${
                    isSelected ? 'scale-125 ring-slate-900' : 'hover:scale-110'
                  }`}
                />
                <span className="absolute left-1/2 -translate-x-1/2 top-4 whitespace-nowrap bg-white text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs border border-slate-200 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  {st.location} ({st.id})
                </span>
              </button>
            );
          })}

          {/* Simple Legend */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs p-2.5 rounded-lg border border-slate-200 shadow-2xs text-[11px] space-y-1.5">
            <div className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">
              Decision Status
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Genuine Weather Event</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Sensor Fault</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Under Review</span>
            </div>
          </div>
        </div>

        {/* Selected Station Mini-Inspector */}
        {selectedStation && (
          <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {selectedStation.name}
                  </span>
                  <StatusBadge type="decision" value={selectedStation.currentDecision} size="sm" />
                </div>
                <div className="text-xs text-slate-500">
                  {selectedStation.id} · Elevation: {selectedStation.elevationMeters}m · Updated {timeAgo(selectedStation.lastUpdate)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="font-bold text-slate-900">
                  {selectedStation.status === 'Offline' ? '—' : `${selectedStation.temperature.toFixed(1)} °C`}
                </span>
                <span className="text-slate-500">
                  {selectedStation.status === 'Offline' ? '—' : `${selectedStation.humidity} %`}
                </span>
                <span className="text-slate-500">
                  {selectedStation.status === 'Offline' ? '—' : `${selectedStation.pressure} hPa`}
                </span>
              </div>

              <button
                onClick={() => onSelectStation(selectedStation.id)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Inspect Station Profile
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Station Table */}
      <Card>
        <CardHeader
          title="STATION DIRECTORY"
          subtitle={`${filtered.length} automatic weather stations configured in monitoring grid`}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Station</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Temperature</th>
                <th className="py-3 px-4">Humidity</th>
                <th className="py-3 px-4">Pressure</th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-4">Assessment Decision</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map(st => (
                <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {st.id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {st.location}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {st.state}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {st.status === 'Offline' ? '—' : `${st.temperature.toFixed(1)} °C`}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {st.status === 'Offline' ? '—' : `${st.humidity} %`}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {st.status === 'Offline' ? '—' : `${st.pressure} hPa`}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-semibold ${
                        st.healthScore >= 90
                          ? 'text-emerald-700'
                          : st.healthScore >= 75
                          ? 'text-amber-700'
                          : st.healthScore > 0
                          ? 'text-rose-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {st.healthScore > 0 ? `${st.healthScore}%` : 'Offline'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge type="decision" value={st.currentDecision} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectStation(st.id)}
                      className="font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
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
