import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, Clock, Radio } from 'lucide-react';
import { AnomalyAlert, PageId } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

interface TopBarProps {
  onMenuToggle: () => void;
  alerts: AnomalyAlert[];
  onAlertSelect: (alert: AnomalyAlert) => void;
  onNavigate: (page: PageId) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onMenuToggle,
  alerts,
  onAlertSelect,
  onNavigate,
}) => {
  const [time, setTime] = useState<string>('');
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowAlertMenu(false);
      }
    };
    if (showAlertMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAlertMenu]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeAlerts = alerts.filter(a => a.status === 'active');

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#D9E1E8] px-4 lg:px-6 flex items-center justify-between">
      {/* Left: Mobile trigger & System Titles */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col justify-center">
          <div className="flex items-center">
            <span className="text-base font-bold text-slate-900 tracking-tight leading-none">
              SkyGuard AI
            </span>
            <span className="hidden sm:inline-block w-px h-3.5 bg-slate-300 mx-2.5 self-center" />
            <span className="hidden sm:inline-block text-xs font-semibold text-slate-500 leading-none translate-y-[0.5px]">
              Weather Observation Quality Control
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-500 sm:hidden mt-1 leading-tight">
            Weather Observation Quality Control
          </span>
        </div>
      </div>

      {/* Right: Operational Status, Time, Alerts */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* System Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-md border border-[#D9E1E8] text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium">QC Engine Active</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500 font-mono">7 AWS</span>
        </div>

        {/* Current Time */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-md border border-[#D9E1E8] text-xs text-slate-700 font-mono">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time || '--:--:--'}</span>
          <span className="text-[10px] text-slate-400">IST</span>
        </div>

        {/* Alerts Bell Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            {activeAlerts.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>

          <AnimatePresence>
            {showAlertMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 3, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden"
              >
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Quality Control Alerts
                  </span>
                  <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {activeAlerts.length} Active
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {alerts.map(a => (
                    <button
                      key={a.id}
                      onClick={() => {
                        onAlertSelect(a);
                        setShowAlertMenu(false);
                      }}
                      className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5"
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          a.decision === 'SENSOR_FAULT'
                            ? 'bg-rose-500'
                            : a.decision === 'GENUINE_EVENT'
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900">
                            {a.decision === 'SENSOR_FAULT'
                              ? 'SENSOR FAULT'
                              : a.decision === 'GENUINE_EVENT'
                              ? 'GENUINE EVENT'
                              : 'UNCERTAIN'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {a.stationId}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 mt-0.5 font-medium truncate">
                          {a.headline}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {a.location}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                  <button
                    onClick={() => {
                      onNavigate('alerts');
                      setShowAlertMenu(false);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View All Alerts in Console →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
