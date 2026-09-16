import React, { useState } from 'react';
import { Card, CardHeader } from '../components/common/Card';
import { Sliders, Lock, Info, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [tempUnit, setTempUnit] = useState<'Celsius' | 'Fahrenheit'>('Celsius');
  const [pressureUnit, setPressureUnit] = useState<'hPa' | 'inHg'>('hPa');
  const [timeFormat, setTimeFormat] = useState<'IST' | 'UTC'>('IST');

  // Read-only methodology fusion parameters
  const methodologyWeights = [
    { name: 'Temporal ML Autoencoder', weight: 0.30, role: 'Time-series reconstruction & rate-of-change continuity' },
    { name: 'Multivariate Thermodynamic Consistency', weight: 0.20, role: 'Psychrometric T vs RH vs P joint relationships' },
    { name: 'Atmospheric Physics Constraints', weight: 0.20, role: 'Enthalpy, dew point depression, & vapor deficit limits' },
    { name: 'Local Climatological & Diurnal Context', weight: 0.15, role: 'Diurnal envelopes & historical station baseline' },
    { name: 'Edge Hardware Verification Rules', weight: 0.10, role: 'Instant MCU step test, electrical range & CRC check' },
    { name: 'Spatial Cross-Station Verification', weight: 0.05, role: 'Distance-weighted peer comparison (when available)' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          System Configuration & Methodology Parameters
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Station display preferences and validated quality-control parameters
        </p>
      </div>

      {/* Methodology Parameters (Read-Only) */}
      <Card>
        <CardHeader
          title="CALIBRATED EVIDENCE FUSION PARAMETERS"
          subtitle="Fixed methodological parameters validated during controlled meteorological benchmark"
          action={
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              <Lock className="w-3 h-3" />
              <span>Read-Only Configuration</span>
            </span>
          }
        />

        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              To ensure scientific rigor and repeatable quality standards, fusion weighting coefficients are calibrated across historical meteorological validation sets and locked against ad-hoc operator tampering.
            </p>
          </div>

          <div className="space-y-3">
            {methodologyWeights.map((w, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{w.name}</span>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    w = {w.weight.toFixed(2)} ({(w.weight * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-700 rounded-full"
                    style={{ width: `${w.weight * 100 * 2}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-500">{w.role}</div>
              </div>
            ))}
          </div>

          <div className="pt-2 text-right text-xs font-mono text-slate-500">
            Sum of Normalized Weights: 1.00 ✓
          </div>
        </div>
      </Card>

      {/* Display & Interface Preferences */}
      <Card>
        <CardHeader
          title="DISPLAY & LOCALIZATION PREFERENCES"
          subtitle="Units and timestamp rendering for the operations console"
        />
        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Temperature Unit</label>
              <select
                value={tempUnit}
                onChange={e => setTempUnit(e.target.value as any)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800"
              >
                <option value="Celsius">Celsius (°C) — WMO Standard</option>
                <option value="Fahrenheit">Fahrenheit (°F)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Barometric Unit</label>
              <select
                value={pressureUnit}
                onChange={e => setPressureUnit(e.target.value as any)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800"
              >
                <option value="hPa">Hectopascals (hPa / mbar)</option>
                <option value="inHg">Inches of Mercury (inHg)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Station Time Zone</label>
              <select
                value={timeFormat}
                onChange={e => setTimeFormat(e.target.value as any)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800"
              >
                <option value="IST">Indian Standard Time (IST, UTC+5:30)</option>
                <option value="UTC">Coordinated Universal Time (UTC)</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Archival Policy */}
      <Card>
        <CardHeader title="QUALITY ARCHIVAL RETENTION" subtitle="Data preservation compliance" />
        <div className="p-5 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Permanent Observation Retention Active</span>
          </div>
          <p className="leading-relaxed">
            Observations are buffered locally for 90 days in fast operational memory and synchronized to long-term immutable meteorological storage. Quality metadata, flags, and model diagnosis traces are cryptographically linked to the original raw values.
          </p>
        </div>
      </Card>
    </div>
  );
};
