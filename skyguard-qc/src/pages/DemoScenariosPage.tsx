import React, { useState } from 'react';
import { DEMO_SCENARIOS } from '../data/mockData';
import { DemoScenario, SensorReading } from '../types';
import { fetchScenario } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { ArrowRight, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DemoScenariosPage: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('B');
  const [apiReadings, setApiReadings] = useState<SensorReading[] | null>(null);
  const [error, setError] = useState(false);

  React.useEffect(() => {
    let mounted = true;
    setApiReadings(null);
    const letterToName = {
      'A': 'A. Normal Weather',
      'B': 'B. Isolated Sensor Fault',
      'C': 'C. Genuine Regional Event (Heatwave)',
      'D': 'D. Example: genuine event + one faulty station',
      'E': 'E. Spatial Logic Disabled (Demonstrate fallback)'
    };
    fetchScenario(letterToName[selectedKey])
      .then(data => {
        if (mounted) {
          setApiReadings(data.readings);
          setError(false);
        }
      })
      .catch(err => {
        console.error("Scenario fetch failed", err);
        if (mounted) setError(true);
      });
    return () => { mounted = false; };
  }, [selectedKey]);

  const baseScenario: DemoScenario = DEMO_SCENARIOS[selectedKey];
  
  // Merge backend data with static presentation data
  const scenario = {
    ...baseScenario,
    readings: error ? [] : (apiReadings ? apiReadings.map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'}),
      temp: r.temperature,
      hum: r.humidity,
      pres: r.pressure,
      flag: r.decision === 'SENSOR_FAULT' ? 'fault' : (r.decision === 'GENUINE_EVENT' ? 'event' : 'normal') as any
    })) : [])
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Demo Scenarios
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Controlled evaluation sequences testing SkyGuard event vs. sensor fault discrimination
        </p>
      </div>

      {/* Scenario Selectors A, B, C, D, E */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(DEMO_SCENARIOS) as ('A' | 'B' | 'C' | 'D' | 'E')[]).map(key => {
          const sc = DEMO_SCENARIOS[key];
          const isSelected = selectedKey === key;
          return (
            <button
              key={key}
              onClick={() => setSelectedKey(key)}
              className={`relative px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-150 flex items-center gap-2 ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {sc.letter}
              </span>
              <span>{sc.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Scenario Detail Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedKey}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6"
        >
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                SCENARIO {scenario.letter} · CONTROLLED DEMONSTRATION CASE
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-0.5">
                {scenario.title}
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                Target Station: <span className="font-semibold text-slate-800">{scenario.station}</span>
              </div>
            </div>

            <div className="self-start sm:self-auto">
              <StatusBadge type="decision" value={scenario.decision} size="lg" />
            </div>
          </div>

          {/* 1. WHAT IS HAPPENING? */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-[11px]">1</span>
              What is happening?
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed font-normal">
              {scenario.whatHappened}
            </p>
            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200">
              <span className="font-semibold text-slate-700 block mb-1">Observed Telemetry Sequence:</span>
              {scenario.observedPattern}
            </div>

            {error && (
              <div className="p-3 mb-3 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">
                Backend connection lost. Real-time sequence data unavailable.
              </div>
            )}
            
            {/* Sequence Pills */}
            <div className="flex flex-wrap items-center gap-2.5 p-4 bg-slate-50/70 rounded-xl border border-slate-200">
              {scenario.readings.map((r, i) => (
                <React.Fragment key={i}>
                  <div
                    className={`p-3 rounded-lg border text-center min-w-[85px] transition-colors duration-150 ${
                      r.flag === 'fault'
                        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200/60'
                        : r.flag === 'event'
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div
                      className={`text-base font-mono font-bold ${
                        r.flag === 'fault'
                          ? 'text-rose-700'
                          : r.flag === 'event'
                          ? 'text-blue-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {r.temp} °C
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {r.hum}% RH · {r.pres} hPa
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {r.time}
                    </div>
                  </div>
                  {i < scenario.readings.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 2. WHAT DID SKYGUARD DECIDE? */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-[11px]">2</span>
              What did SkyGuard decide?
            </h3>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  System Decision
                </div>
                <div className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                  {scenario.finalDecision}
                </div>
              </div>
              <StatusBadge type="decision" value={scenario.decision} size="md" />
            </div>
          </div>

          {/* 3. WHY? */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-[11px]">3</span>
              Why?
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-200">
              {scenario.why}
            </p>
          </div>

          {/* 4. WHAT EVIDENCE IS AVAILABLE? */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center text-[11px]">4</span>
              What evidence is available?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">
                  Temporal Evidence
                </span>
                <span className="text-slate-600 leading-relaxed">{scenario.evidence.temporal}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">
                  Multivariate Evidence
                </span>
                <span className="text-slate-600 leading-relaxed">{scenario.evidence.multivariate}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">
                  Physics Consistency
                </span>
                <span className="text-slate-600 leading-relaxed">{scenario.evidence.physics}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">
                  Spatial Evidence
                </span>
                <span className="text-slate-600 leading-relaxed">{scenario.evidence.spatial}</span>
              </div>
            </div>
          </div>

          {/* Optional Notes */}
          {scenario.notes && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{scenario.notes}</span>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
