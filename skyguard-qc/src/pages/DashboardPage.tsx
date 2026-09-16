import React, { useState } from 'react';
import { Station, AnomalyAlert, PageId, SensorReading } from '../types';
import { DecisionCard } from '../components/common/DecisionCard';
import { MetricCard } from '../components/common/MetricCard';
import { SensorChart } from '../components/common/SensorChart';
import { WhyThisDecision } from '../components/common/WhyThisDecision';
import { EvidenceSummary } from '../components/common/EvidenceSummary';
import { StatusBadge } from '../components/common/StatusBadge';
import { Card, CardHeader } from '../components/common/Card';
import { timeAgo } from '../data/mockData';
import { fetchObservations } from '../services/api';
import {
  Thermometer,
  Droplets,
  Gauge,
  HeartPulse,
  AlertTriangle,
  Radio,
  MapPin,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface DashboardPageProps {
  stations: Station[];
  alerts: AnomalyAlert[];
  onSelectStation: (stationId: string) => void;
  onSelectAlert: (alert: AnomalyAlert) => void;
  onNavigate: (page: PageId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stations,
  alerts,
  onSelectStation,
  onSelectAlert,
  onNavigate,
}) => {
  // Default to Chennai Meenambakkam or Jaisalmer Desert for active demonstration of quality control decisions
  const [activeStationId, setActiveStationId] = useState<string>('Chennai_Meenambakkam');

  const activeStation = stations.find(s => s.id === activeStationId) || stations[0];
  const activeAlert = alerts.find(a => a.stationId === activeStationId);

  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    setLoadingReadings(true);
    fetchObservations(activeStationId, 45)
      .then(data => {
        if (mounted) {
          setReadings(data);
          setLoadingReadings(false);
        }
      })
      .catch(err => {
        console.warn("Failed to fetch observations, using empty array", err);
        if (mounted) {
          setReadings([]);
          setLoadingReadings(false);
        }
      });
    return () => { mounted = false; };
  }, [activeStationId]);

  const latestReading = readings[readings.length - 1] || {
    temperature: activeStation.temperature,
    humidity: activeStation.humidity,
    pressure: activeStation.pressure,
  };

  // Station counts
  const onlineCount = stations.filter(s => s.status === 'Online').length;
  const warningCount = stations.filter(s => s.status === 'Warning').length;
  const alertCount = stations.filter(s => s.status === 'Alert').length;
  const offlineCount = stations.filter(s => s.status === 'Offline').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase">
            SKYGUARD OBSERVATION MONITOR
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatic Weather Station quality control · Observation → Evidence → Decision → Action
          </p>
        </div>

        {/* Station switcher for immediate inspection */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label htmlFor="station-inspector-select" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Inspecting Station:
          </label>
          <select
            id="station-inspector-select"
            value={activeStationId}
            onChange={e => setActiveStationId(e.target.value)}
            className="text-xs font-medium bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
          >
            {stations.map(st => (
              <option key={st.id} value={st.id}>
                {st.name} ({st.currentDecision})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. CURRENT ASSESSMENT (Visually Dominant Card) */}
      <DecisionCard
        decision={activeStation.currentDecision}
        stationName={activeStation.name}
        stationId={activeStation.id}
        readingDisplay={`${activeStation.temperature.toFixed(1)} °C`}
        readingMetric="Temperature"
        summary={activeStation.assessmentSummary}
        technicalQualityFlag={
          activeStation.currentDecision === 'SENSOR_FAULT'
            ? 'FAIL'
            : activeStation.currentDecision === 'UNCERTAIN'
            ? 'SUSPECT'
            : 'PASS'
        }
        onInspectDetails={() => {
          if (activeAlert) {
            onSelectAlert(activeAlert);
          } else {
            onSelectStation(activeStation.id);
          }
        }}
      />

      {/* 3. WEATHER METRIC CARDS */}
      <div>
        <div className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3">
          TELEMETRY & NETWORK STATUS
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Primary Cards */}
          <MetricCard
            title="Temperature"
            value={latestReading.temperature}
            unit="°C"
            delta={
              activeStation.currentDecision === 'SENSOR_FAULT'
                ? '+22.0 °C transient jump'
                : activeStation.currentDecision === 'GENUINE_EVENT'
                ? '+4.8 °C synoptic climb'
                : '+0.6 °C from baseline'
            }
            deltaType={
              activeStation.currentDecision === 'SENSOR_FAULT' ? 'negative' : 'neutral'
            }
            icon={<Thermometer className="w-4 h-4" />}
          />

          <MetricCard
            title="Humidity"
            value={latestReading.humidity}
            unit="%"
            delta="-2 % RH diurnal shift"
            icon={<Droplets className="w-4 h-4" />}
          />

          <MetricCard
            title="Pressure"
            value={latestReading.pressure}
            unit="hPa"
            delta="+0.8 hPa diurnal drift"
            icon={<Gauge className="w-4 h-4" />}
          />

          <MetricCard
            title="Station Health"
            value={activeStation.healthScore}
            unit="/ 100"
            status={
              activeStation.healthScore >= 90
                ? 'Healthy'
                : activeStation.healthScore >= 75
                ? 'Degrading'
                : 'Inspection Req.'
            }
            statusVariant={
              activeStation.healthScore >= 90
                ? 'normal'
                : activeStation.healthScore >= 75
                ? 'warning'
                : 'alert'
            }
            icon={<HeartPulse className="w-4 h-4" />}
          />

          {/* Secondary Cards */}
          <MetricCard
            title="Active Alerts"
            value={alerts.filter(a => a.status === 'active').length}
            status={alerts.filter(a => a.status === 'active').length > 0 ? 'Review' : 'Nominal'}
            statusVariant={alerts.filter(a => a.status === 'active').length > 0 ? 'alert' : 'normal'}
            icon={<AlertTriangle className="w-4 h-4" />}
          />

          <MetricCard
            title="Stations Online"
            value={`${onlineCount} / ${stations.length}`}
            status="Network Active"
            statusVariant="normal"
            icon={<Radio className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* 4. MAIN CHART (Selector: Temperature | Humidity | Pressure) */}
      <SensorChart
        readings={readings}
        onPointSelect={r => {
          if (r.decision === 'SENSOR_FAULT' && activeAlert) {
            onSelectAlert(activeAlert);
          }
        }}
      />

      {/* 5. "WHY THIS DECISION?" & EVIDENCE SUMMARY (Side-by-side) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Human-readable "Why This Decision?" */}
        <WhyThisDecision
          decision={activeStation.currentDecision}
          customPoints={activeAlert?.evidencePoints}
        />

        {/* Evidence Summary with expandable Technical Evidence */}
        <EvidenceSummary
          decision={activeStation.currentDecision}
          fusionScore={activeAlert?.fusionScore ?? (activeStation.currentDecision === 'NORMAL' ? 0.12 : 0.48)}
          confidencePercent={activeAlert?.confidencePercent ?? 94}
          layers={activeAlert?.layerScores}
        />
      </div>

      {/* 6. RECENT ALERTS (Decision First!) */}
      <Card>
        <CardHeader
          title="RECENT ALERTS & QUALITY LOGS"
          subtitle="Triage decisions prioritized over technical scores"
          action={
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900"
            >
              Open Alerts Console →
            </button>
          }
        />

        <div className="divide-y divide-slate-100">
          {alerts.map(a => (
            <div
              key={a.id}
              onClick={() => onSelectAlert(a)}
              className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Decision Tag First */}
                  <StatusBadge
                    type="decision"
                    value={a.decision}
                    size="sm"
                  />
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {a.stationId}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs font-medium text-slate-700">
                    {a.location}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[11px] text-slate-400">
                    {timeAgo(a.detectedAt)}
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-900">
                  {a.headline}
                </div>

                <div className="text-xs text-slate-600 line-clamp-1">
                  {a.summary}
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto flex-shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">
                    Evidence Index
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-700">
                    {a.fusionScore.toFixed(2)}
                  </div>
                </div>

                <button className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors inline-flex items-center gap-1">
                  <span>Investigate</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 7. STATION NETWORK (Map & Clean Summary Table) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
              STATION NETWORK CONTEXT
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated weather station geographic distribution across India
            </p>
          </div>

          {/* Compact Network Summary: Stations online, Under review, Faults, Offline */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
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

        {/* Clean Station Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Station ID</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Current Temp</th>
                  <th className="py-3 px-4">Humidity</th>
                  <th className="py-3 px-4">Pressure</th>
                  <th className="py-3 px-4">Health</th>
                  <th className="py-3 px-4">Current Assessment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {stations.map(st => {
                  const isSelected = st.id === activeStationId;
                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
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
                          onClick={() => {
                            setActiveStationId(st.id);
                            onSelectStation(st.id);
                          }}
                          className="font-semibold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                        >
                          <span>View Detail</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
