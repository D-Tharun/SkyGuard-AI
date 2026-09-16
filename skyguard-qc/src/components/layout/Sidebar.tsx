import React from 'react';
import { PageId } from '../../types';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Radio,
  AlertTriangle,
  Activity,
  FileSearch,
  BarChart3,
  HeartPulse,
  Database,
  FileText,
  Boxes,
  HelpCircle,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Shield,
  X,
} from 'lucide-react';

interface SidebarProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  activeAlertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  activeAlertCount = 2,
}) => {
  const navSections: {
    label: string;
    items: {
      id: PageId;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      badge?: number | string;
    }[];
  }[] = [
    {
      label: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'MONITORING',
      items: [
        { id: 'stations', label: 'Stations', icon: Radio },
        { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: activeAlertCount },
        { id: 'live', label: 'Live Stream', icon: Activity },
      ],
    },
    {
      label: 'INVESTIGATION',
      items: [
        { id: 'observation-details', label: 'Observation Detail', icon: FileSearch },
        { id: 'performance', label: 'Performance', icon: BarChart3 },
      ],
    },
    {
      label: 'DEMO',
      items: [
        { id: 'scenarios', label: 'Scenarios', icon: Boxes },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { id: 'health', label: 'Sensor Health', icon: HeartPulse },
        { id: 'explorer', label: 'Data Explorer', icon: Database },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'architecture', label: 'Architecture', icon: HelpCircle },
        { id: 'settings', label: 'Settings', icon: Sliders },
      ],
    },
  ];

  const handleNavClick = (id: PageId) => {
    setCurrentPage(id);
    setMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#0B1329] text-slate-300">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#D9E1E8]/20">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-600/90 flex items-center justify-center text-white flex-shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex flex-col justify-center">
              <div className="text-base font-bold text-white tracking-tight leading-none">
                SkyGuard AI
              </div>
              <div className="text-xs font-semibold text-slate-400 mt-1 truncate leading-tight">
                AWS Observation QC
              </div>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links - Scrollbar removed */}
      <div className="flex-1 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-3 px-2 space-y-3.5">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-0.5">
            {!collapsed && (
              <div className="px-2.5 py-0.5 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors duration-150 relative ${
                      isActive
                        ? 'bg-slate-800/90 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="sidebarActivePill"
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r"
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                      />
                    )}
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    {!collapsed && (
                      <span className="truncate flex-1 text-left">
                        {item.label}
                      </span>
                    )}
                    {!collapsed && item.badge !== undefined && (
                      <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#D9E1E8]/20 bg-transparent">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 px-1 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-slate-300 leading-tight">
                Network: Nominal
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                7 Indian AWS Online
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Network: Nominal" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 transition-all duration-200 ease-in-out border-r border-b border-[#D9E1E8] ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {navContent}
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-[#D9E1E8] rounded-full shadow-xs flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors z-50"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10 shadow-xl">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
