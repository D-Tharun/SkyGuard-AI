import React from 'react';
import { Card, CardHeader } from '../components/common/Card';
import { ArrowDown, Shield, Cpu, Network, CheckCircle2, HelpCircle } from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const steps = [
    {
      title: 'BME280 / AWS',
      subtitle: 'Primary in-situ meteorological transducer (Temp, Humidity, Pressure)',
      tier: 'Hardware & Sensing',
    },
    {
      title: 'Edge QC',
      subtitle: 'On-device MCU checks (instant range plausibility, SPI/I2C checksums, step limits)',
      tier: 'Edge Layer',
    },
    {
      title: 'Wi-Fi / Cellular Uplink',
      subtitle: 'Encrypted MQTT / HTTPS observation telemetry packet transport',
      tier: 'Telemetry Uplink',
    },
    {
      title: 'SkyGuard QC Engine',
      subtitle: 'Central quality control ingestion service with archival preservation',
      tier: 'Core Ingestion',
    },
    {
      title: 'ML + Physics + Context',
      subtitle: 'Independent parallel evaluation: LSTM temporal autoencoder, thermodynamic equations, and climatological context',
      tier: 'Multi-Modal Reasoning',
    },
    {
      title: 'Evidence Fusion',
      subtitle: 'Calibrated evidence synthesis across all observation dimensions',
      tier: 'Synthesis',
    },
    {
      title: 'Fault / Event Decision',
      subtitle: 'Operational triage: Normal, Genuine Extreme Weather Event, Sensor Fault, or Uncertain',
      tier: 'Decision State',
    },
    {
      title: 'Dashboard & Forecast Pipeline',
      subtitle: 'Real-time operator interface, alerts dispatch, and downstream model dissemination',
      tier: 'Dissemination',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          System Architecture & Methodological Design
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Engineering design of the SkyGuard meteorological observation quality-control system
        </p>
      </div>

      {/* The Core Question (Prominent Card) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-xs text-center space-y-4">
        <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
          THE CORE OPERATIONAL QUESTION
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight italic">
          “Is this unusual observation caused by the sensor/data system, or is it genuine weather?”
        </h2>
        <p className="text-xs md:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Standard operational QC either indiscriminately accepts sensor glitches into critical forecasts or naively discards historic climate extremes as "impossible step jumps". SkyGuard bridges this gap through multi-modal evidence fusion.
        </p>
      </div>

      {/* Clean Linear Architecture Diagram */}
      <Card>
        <CardHeader
          title="END-TO-END DATA FLOW PIPELINE"
          subtitle="From physical sensor transduction to quality-controlled dissemination"
        />
        <div className="p-6 md:p-8">
          <div className="max-w-xl mx-auto space-y-3">
            {steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 transition-all hover:border-slate-300">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <span>Step {idx + 1}</span>
                    <span>{step.tier}</span>
                  </div>
                  <div className="text-sm md:text-base font-bold text-slate-900">
                    {step.title}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {step.subtitle}
                  </div>
                </div>

                {idx < steps.length - 1 && (
                  <div className="flex justify-center my-1 text-slate-400">
                    <ArrowDown className="w-4 h-4 stroke-[2]" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Card>

      {/* Hardware Roadmap Section (Strictly honest, no fake streaming claims) */}
      <Card>
        <CardHeader
          title="HARDWARE INTEGRATION ROADMAP"
          subtitle="Physical node architecture prepared for field deployment"
        />
        <div className="p-6 space-y-3 text-xs text-slate-700 leading-relaxed">
          <p>
            SkyGuard's edge architecture is engineered to run on low-power microcontrollers deployed at remote Automatic Weather Stations (AWS):
          </p>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800">
            BME280 (I2C) → ESP32 (Edge QC C++ Firmware) → Wi-Fi / LTE-M → SkyGuard QC Engine → React UI
          </div>
          <p className="text-slate-500 text-[11px]">
            * Note on Hardware Telemetry: In this interface demonstration, observation sequences reflect calibrated test datasets. When physical ESP32 nodes are provisioned in the field, dedicated telemetry streaming endpoints will attach directly to this pipeline.
          </p>
        </div>
      </Card>
    </div>
  );
};
