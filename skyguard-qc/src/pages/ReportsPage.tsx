import React, { useState } from 'react';
import { Station, AnomalyAlert } from '../types';
import { Card, CardHeader } from '../components/common/Card';
import { FileText, Download, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { formatDateTime } from '../data/mockData';

interface ReportsPageProps {
  stations: Station[];
  alerts: AnomalyAlert[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ stations, alerts }) => {
  const [selectedReport, setSelectedReport] = useState('DAILY_SUMMARY');
  const [isGenerated, setIsGenerated] = useState(true);

  const reportList = [
    {
      id: 'DAILY_SUMMARY',
      title: 'Daily Meteorological Observation QC Summary',
      period: 'Past 24 Hours',
      desc: 'Network-wide summary of observations logged, flags raised, and classified events.',
    },
    {
      id: 'SENSOR_DEGRADATION',
      title: 'Station Instrument Degradation & Health Audit',
      period: 'Past 7 Days',
      desc: 'Rolling evaluation of sensor drift, variance anomalies, and maintenance recommendations.',
    },
    {
      id: 'GENUINE_EXTREMES',
      title: 'Verified Genuine Meteorological Extremes Log',
      period: 'Past 30 Days',
      desc: 'Catalog of severe atmospheric occurrences validated and preserved against erroneous rejection.',
    },
  ];

  const handleDownload = () => {
    alert(`Downloading ${selectedReport}.pdf (Meteorological Standard Format)`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          Observation Quality Reports
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Auditable quality-assurance bulletins and station maintenance reports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Left Column: Report Selection */}
        <Card className="md:col-span-1 p-3 space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            Available Reports
          </div>
          {reportList.map(rep => (
            <button
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                selectedReport === rep.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="font-bold">{rep.title}</div>
              <div
                className={`text-[10px] mt-1 ${
                  selectedReport === rep.id ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                Period: {rep.period}
              </div>
            </button>
          ))}
        </Card>

        {/* Right Column: Report Preview */}
        <Card className="md:col-span-2">
          <CardHeader
            title="REPORT PREVIEW & EXPORT"
            subtitle="Formatted for operational meteorological archive"
            action={
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            }
          />

          <div className="p-6 space-y-5 text-xs text-slate-700">
            {/* Header Block */}
            <div className="border-b border-slate-200 pb-4">
              <div className="text-[10px] font-mono text-slate-400">SKYGUARD QC SYSTEM · BULLETIN #2024-09</div>
              <h2 className="text-base font-bold text-slate-900 mt-1">
                {reportList.find(r => r.id === selectedReport)?.title}
              </h2>
              <div className="text-slate-500 mt-0.5">
                Generated at {formatDateTime(Date.now())} · Reporting Period: {reportList.find(r => r.id === selectedReport)?.period}
              </div>
            </div>

            {/* Executive Summary */}
            <div className="space-y-1.5">
              <div className="font-bold text-slate-900 uppercase text-[11px]">
                1. Executive Summary
              </div>
              <p className="leading-relaxed text-slate-600">
                During the evaluation interval across 7 automatic weather stations in the network, a total of 10,080 raw sensor observations were processed by the multi-modal evidence fusion engine. <strong>3 observations were flagged</strong> for operational investigation: 1 transient sensor spike (Chennai Meenambakkam), 1 verified genuine extreme heatwave (Jaisalmer Desert), and 1 sensor baseline drift under review (New Delhi Safdarjung).
              </p>
            </div>

            {/* Station Status Summary Table */}
            <div className="space-y-2">
              <div className="font-bold text-slate-900 uppercase text-[11px]">
                2. Station Operational Overview
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Station</th>
                      <th className="py-2 px-3">Location</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Health</th>
                      <th className="py-2 px-3">Decisions Logged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {stations.map(st => (
                      <tr key={st.id}>
                        <td className="py-2 px-3 font-mono font-bold">{st.name}</td>
                        <td className="py-2 px-3">{st.location}</td>
                        <td className="py-2 px-3">{st.status}</td>
                        <td className="py-2 px-3 font-mono">{st.healthScore}/100</td>
                        <td className="py-2 px-3 font-medium">{st.currentDecision}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-1.5 pt-2">
              <div className="font-bold text-slate-900 uppercase text-[11px]">
                3. Quality Actions Dispatched
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-600 text-xs">
                <li>Chennai Meenambakkam: Maintenance order created for wiring harness inspection.</li>
                <li>Jaisalmer Desert: Extreme high-temperature observation verified and retained in climate bulletin.</li>
                <li>New Delhi Safdarjung: Field calibration scheduled to correct -1.8 °C sensor drift.</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
