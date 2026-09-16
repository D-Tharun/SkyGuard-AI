import React, { useState } from 'react';
import { Station, AnomalyAlert } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { StatusBadge } from '../components/common/StatusBadge';
import { SensorChart } from '../components/common/SensorChart';
import { MetricCard } from '../components/common/MetricCard';
import { formatDateTime, timeAgo } from '../data/mockData';
import { fetchObservations } from '../services/api';
import { SensorReading } from '../types';
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  Gauge,
  HeartPulse,
  Radio,
  FileDown,
  AlertTriangle,
} from 'lucide-react';

interface StationDetailPageProps {
  stationId: string;
  stations: Station[];
  alerts: AnomalyAlert[];
  onBack: () => void;
  onSelectAlert: (alert: AnomalyAlert) => void;
}

export const StationDetailPage: React.FC<StationDetailPageProps> = ({
  stationId,
  stations,
  alerts,
  onBack,
  onSelectAlert,
}) => {
  const station = stations.find(s => s.id === stationId) || stations[0];
  const stationAlerts = alerts.filter(a => a.stationId === stationId);

  const [readings, setReadings] = React.useState<SensorReading[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchObservations(stationId, 40)
      .then(data => {
        if (mounted) {
          setReadings(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.warn("Failed to fetch observations", err);
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [stationId]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button & Station Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Stations Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Hardware Profile:</span>
          <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {station.sensorModel}
          </span>
        </div>
      </div>

      {/* Main Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="font-mono text-xs font-bold text-slate-500">
              {station.id}
            </span>
            <StatusBadge type="decision" value={station.currentDecision} size="sm" />
            <StatusBadge type="station" value={station.status} size="sm" />
          </div>

          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {station.name}
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            {station.state} · Coordinates: {station.lat.toFixed(4)}°N, {station.lng.toFixed(4)}°E · Elevation: {station.elevationMeters}m MSL
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="text-center">
            <div className="text-[10px] text-slate-400 uppercase font-medium">Health Index</div>
            <div className="text-xl font-bold text-slate-900">{station.healthScore}/100</div>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-center">
            <div className="text-[10px] text-slate-400 uppercase font-medium">Anomalies</div>
            <div className="text-xl font-bold text-slate-900">{station.activeAnomalies}</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          title="Current Temperature"
          value={station.status === 'Offline' ? '—' : station.temperature.toFixed(1)}
          unit="°C"
          delta="Diurnal baseline +0.4 °C"
          icon={<Thermometer className="w-4 h-4" />}
        />
        <MetricCard
          title="Relative Humidity"
          value={station.status === 'Offline' ? '—' : station.humidity}
          unit="%"
          delta="Psychrometrically aligned"
          icon={<Droplets className="w-4 h-4" />}
        />
        <MetricCard
          title="Atmospheric Pressure"
          value={station.status === 'Offline' ? '—' : station.pressure}
          unit="hPa"
          delta="Barometric tide stable"
          icon={<Gauge className="w-4 h-4" />}
        />
        <MetricCard
          title="Observation Health"
          value={`${station.healthScore}%`}
          status={station.healthScore >= 90 ? 'Nominal' : 'Inspect'}
          statusVariant={station.healthScore >= 90 ? 'normal' : 'alert'}
          icon={<HeartPulse className="w-4 h-4" />}
        />
      </div>

      {/* Sensor Chart Area */}
      <SensorChart readings={readings} />

      {/* Quality Event Log for this Station */}
      <Card>
        <CardHeader
          title="STATION OBSERVATION QUALITY LOG"
          subtitle="Recent automated checks, flags, and investigations for this station"
        />
        {stationAlerts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No active quality alerts logged for this station. Telemetry is within operational thresholds.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {stationAlerts.map(a => (
              <div
                key={a.id}
                onClick={() => onSelectAlert(a)}
                className="p-4 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge type="decision" value={a.decision} size="sm" />
                    <span className="text-xs font-bold text-slate-900">{a.headline}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({formatDateTime(a.detectedAt)})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{a.summary}</p>
                </div>

                <button className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors self-end sm:self-auto">
                  Investigate →
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
