import React, { useState } from 'react';
import { SensorReading } from '../../types';
import { formatTime } from '../../data/mockData';
import { motion, AnimatePresence } from 'motion/react';

interface SensorChartProps {
  readings: SensorReading[];
  height?: number;
  className?: string;
  defaultVariable?: 'temperature' | 'humidity' | 'pressure';
  onPointSelect?: (reading: SensorReading) => void;
}

export const SensorChart: React.FC<SensorChartProps> = ({
  readings,
  height = 280,
  className = '',
  defaultVariable = 'temperature',
  onPointSelect,
}) => {
  const [selectedVar, setSelectedVar] = useState<'temperature' | 'humidity' | 'pressure'>(defaultVariable);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const varConfig = {
    temperature: {
      label: 'Temperature',
      unit: '°C',
      strokeColor: '#2563EB', // Muted weather-blue accent
      gradientId: 'tempGrad',
      minPadding: 2,
    },
    humidity: {
      label: 'Humidity',
      unit: '%',
      strokeColor: '#0284C7',
      gradientId: 'humGrad',
      minPadding: 5,
    },
    pressure: {
      label: 'Pressure',
      unit: 'hPa',
      strokeColor: '#475569',
      gradientId: 'presGrad',
      minPadding: 2,
    },
  }[selectedVar];

  if (!readings || readings.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
        No observation records available
      </div>
    );
  }

  // Layout parameters
  const padding = { top: 25, right: 30, bottom: 40, left: 55 };
  const width = 850;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = readings.map(r => r[selectedVar]);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const min = Math.floor(rawMin - varConfig.minPadding);
  const max = Math.ceil(rawMax + varConfig.minPadding);
  const range = max - min || 1;

  const getX = (i: number) => padding.left + (i / Math.max(1, readings.length - 1)) * chartW;
  const getY = (val: number) => padding.top + chartH - ((val - min) / range) * chartH;

  // Build SVG path
  const points = readings.map((r, i) => `${getX(i).toFixed(1)},${getY(r[selectedVar]).toFixed(1)}`).join(' ');

  // Generate 4 Y-axis ticks
  const yTicks = [0, 0.33, 0.66, 1].map(ratio => {
    const val = min + ratio * range;
    return {
      value: val.toFixed(selectedVar === 'pressure' ? 0 : 1),
      y: padding.top + chartH - ratio * chartH,
    };
  });

  // Time labels (every ~6 points)
  const step = Math.max(1, Math.floor(readings.length / 5));
  const timeLabels = readings
    .map((r, i) => ({ reading: r, index: i }))
    .filter(({ index }) => index % step === 0 || index === readings.length - 1);

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            TIME-SERIES OBSERVATION PROFILE
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Single-variable telemetry scale — {varConfig.label} ({varConfig.unit})
          </p>
        </div>

        {/* Clean Variable Selector: Temperature | Humidity | Pressure */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium relative">
          {(['temperature', 'humidity', 'pressure'] as const).map(v => (
            <button
              key={v}
              onClick={() => setSelectedVar(v)}
              className={`relative px-3 py-1 rounded-md transition-colors duration-150 z-10 ${
                selectedVar === v
                  ? 'text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {selectedVar === v && (
                <motion.span
                  layoutId="activeSensorVar"
                  className="absolute inset-0 bg-white rounded-md shadow-xs -z-10"
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                />
              )}
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Legend showing markers */}
      <div className="flex flex-wrap items-center gap-4 mb-3 text-[11px] text-slate-600">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-0.5 bg-blue-600 inline-block rounded" />
          Observation Series
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 inline-block" />
          Red Marker = Sensor / Data Fault
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200 inline-block" />
          Blue Marker = Genuine Weather Event
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200 inline-block" />
          Amber Marker = Uncertain / Review
        </span>
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ minWidth: 600 }}
        >
          {/* Subtle Horizontal Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={width - padding.right}
                y2={tick.y}
                stroke="#E2E8F0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[11px] fill-slate-400 font-mono"
              >
                {tick.value}
              </text>
            </g>
          ))}

          {/* Continuous Observation Polyline */}
          <motion.polyline
            key={selectedVar}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            points={points}
            fill="none"
            stroke={varConfig.strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Event & Fault Markers */}
          {readings.map((r, i) => {
            const cx = getX(i);
            const cy = getY(r[selectedVar]);

            if (r.decision === 'SENSOR_FAULT') {
              return (
                <g key={i} className="cursor-pointer" onClick={() => onPointSelect?.(r)}>
                  <circle cx={cx} cy={cy} r="6" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="2" />
                  <line x1={cx - 3} y1={cy - 3} x2={cx + 3} y2={cy + 3} stroke="#FFFFFF" strokeWidth="1.5" />
                  <line x1={cx + 3} y1={cy - 3} x2={cx - 3} y2={cy + 3} stroke="#FFFFFF" strokeWidth="1.5" />
                </g>
              );
            }

            if (r.decision === 'GENUINE_EVENT' && i % 4 === 0) {
              return (
                <g key={i} className="cursor-pointer" onClick={() => onPointSelect?.(r)}>
                  <circle cx={cx} cy={cy} r="5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2" />
                </g>
              );
            }

            if (r.decision === 'UNCERTAIN' && i % 5 === 0) {
              return (
                <g key={i} className="cursor-pointer" onClick={() => onPointSelect?.(r)}>
                  <circle cx={cx} cy={cy} r="5" fill="#D97706" stroke="#FFFFFF" strokeWidth="2" />
                </g>
              );
            }

            return null;
          })}

          {/* Hover hit targets */}
          {readings.map((r, i) => (
            <rect
              key={i}
              x={getX(i) - 8}
              y={padding.top}
              width={16}
              height={chartH}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onPointSelect?.(r)}
            />
          ))}

          {/* Hover highlight */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={padding.top}
                x2={getX(hoveredIndex)}
                y2={padding.top + chartH}
                stroke="#94A3B8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(readings[hoveredIndex][selectedVar])}
                r="4.5"
                fill={varConfig.strokeColor}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X Axis Time Labels */}
          {timeLabels.map(({ reading, index }) => (
            <text
              key={index}
              x={getX(index)}
              y={height - 12}
              textAnchor="middle"
              className="text-[11px] fill-slate-400 font-mono"
            >
              {formatTime(reading.timestamp).slice(0, 5)}
            </text>
          ))}
        </svg>
      </div>

      <AnimatePresence>
        {hoveredIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 1 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="mt-2 px-3 py-1.5 bg-slate-50 rounded border border-slate-200 text-xs flex items-center justify-between text-slate-700"
          >
            <span>
              Observation: <strong className="text-slate-900">{readings[hoveredIndex][selectedVar]} {varConfig.unit}</strong> at {formatTime(readings[hoveredIndex].timestamp)}
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              Assessment: {readings[hoveredIndex].decision} (Flag: {readings[hoveredIndex].qualityFlag})
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
