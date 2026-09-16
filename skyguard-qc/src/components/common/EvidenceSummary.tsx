import React, { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { AssessmentDecision } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAnimatedNumber, transitions } from '../../utils/motion';

interface EvidenceSummaryProps {
  decision: AssessmentDecision;
  fusionScore?: number;
  confidencePercent?: number;
  layers?: {
    layer: string;
    level: 'Strong' | 'Moderate' | 'Low' | 'Normal';
    score: number;
    description: string;
  }[];
  className?: string;
}

export const EvidenceSummary: React.FC<EvidenceSummaryProps> = ({
  decision,
  fusionScore = 0.15,
  confidencePercent = 94,
  layers,
  className = '',
}) => {
  const [showTechnical, setShowTechnical] = useState(false);
  const animatedConfidence = useAnimatedNumber(confidencePercent, 0, 350);
  const animatedFusion = useAnimatedNumber(fusionScore, 2, 350);

  const defaultLayers = layers || [
    {
      layer: 'Temporal evidence',
      level: decision === 'SENSOR_FAULT' ? 'Strong' : decision === 'UNCERTAIN' ? 'Moderate' : 'Normal',
      score: decision === 'SENSOR_FAULT' ? 0.94 : 0.12,
      description: 'Temporal rate-of-change continuity & historical diurnal shape',
    },
    {
      layer: 'Multivariate evidence',
      level: decision === 'SENSOR_FAULT' ? 'Moderate' : decision === 'GENUINE_EVENT' ? 'Normal' : 'Normal',
      score: decision === 'SENSOR_FAULT' ? 0.78 : 0.08,
      description: 'Psychrometric alignment between Temperature, Humidity and Pressure',
    },
    {
      layer: 'Physics consistency',
      level: decision === 'SENSOR_FAULT' ? 'Strong' : decision === 'UNCERTAIN' ? 'Low' : 'Normal',
      score: decision === 'SENSOR_FAULT' ? 0.88 : 0.05,
      description: 'Thermodynamic enthalpy and vapor pressure deficit bounds',
    },
    {
      layer: 'Context',
      level: 'Strong',
      score: 0.65,
      description: 'Local climatological records, station elevation, and diurnal profile',
    },
    {
      layer: 'Spatial evidence',
      level: decision === 'GENUINE_EVENT' ? 'Normal' : decision === 'SENSOR_FAULT' ? 'Moderate' : 'Normal',
      score: decision === 'SENSOR_FAULT' ? 0.76 : 0.10,
      description: 'Cross-comparison against neighbouring automatic weather stations',
    },
  ];

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'Strong':
        return 'bg-slate-800 text-white';
      case 'Moderate':
        return 'bg-slate-200 text-slate-800';
      case 'Low':
        return 'bg-slate-100 text-slate-600';
      case 'Available':
      case 'Consistent':
      case 'Normal':
      default:
        return 'bg-emerald-50 text-emerald-800 border border-emerald-200';
    }
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            EVIDENCE SUMMARY
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational confidence across multi-modal evidence layers
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
          Confidence: <span className="font-semibold text-slate-800 tabular-nums">{animatedConfidence}%</span>
        </span>
      </div>

      <div className="space-y-3">
        {defaultLayers.map((l, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 last:border-0">
            <div className="flex flex-col">
              <span className="font-medium text-slate-800">{l.layer}</span>
              <span className="text-[11px] text-slate-500">{l.description}</span>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-colors duration-150 ${getLevelBadge(l.level)}`}>
              {l.level === 'Normal' ? 'Consistent' : l.level}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 py-1 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            TECHNICAL EVIDENCE & QUANTITATIVE SCORES
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ease-out ${
              showTechnical ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {showTechnical && (
            <motion.div
              {...transitions.accordion}
              className="overflow-hidden"
            >
              <div className="mt-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Composite Fusion Index:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 tabular-nums">
                    {animatedFusion}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Calculated via calibrated weighted evidence integration across edge rules (10%), temporal ML autoencoder (30%), multivariate clustering (20%), physics checks (20%), contextual baseline (15%), and spatial distance weighting (5%).
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                  <div className="text-[11px] font-semibold text-slate-700">Quantitative Layer Scores (0.0 to 1.0):</div>
                  {defaultLayers.map((l, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>{l.layer}</span>
                      <span className="font-mono font-medium text-slate-800">{l.score.toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-slate-500 italic pt-1">
                  * Note: The fusion score is a diagnostic aid and does not constitute absolute truth without meteorologist verification.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
