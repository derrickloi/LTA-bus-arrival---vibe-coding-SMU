import React from 'react';
import { Bus, Bell, PlayCircle, Radio } from 'lucide-react';

interface TopNavProps {
  activeTab: 'arrivals' | 'map' | 'routes' | 'alerts';
  onTabChange: (tab: 'arrivals' | 'map' | 'routes' | 'alerts') => void;
  activeAlertsCount: number;
  onOpenQuickSimulate: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  activeAlertsCount,
  onOpenQuickSimulate,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onTabChange('arrivals')}
          className="flex items-center gap-2.5 text-left text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-sm shadow-rose-600/30">
            <Bus className="w-4 h-4" />
          </div>
          <span>SG BusPulse</span>
        </button>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
          <button
            onClick={() => onTabChange('arrivals')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-white ${
              activeTab === 'arrivals'
                ? 'text-rose-600 dark:text-rose-400 font-semibold underline underline-offset-8 decoration-2 decoration-rose-600'
                : ''
            }`}
          >
            Live Arrivals
          </button>
          <button
            onClick={() => onTabChange('map')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-white ${
              activeTab === 'map'
                ? 'text-rose-600 dark:text-rose-400 font-semibold underline underline-offset-8 decoration-2 decoration-rose-600'
                : ''
            }`}
          >
            Interactive Map
          </button>
          <button
            onClick={() => onTabChange('routes')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-white ${
              activeTab === 'routes'
                ? 'text-rose-600 dark:text-rose-400 font-semibold underline underline-offset-8 decoration-2 decoration-rose-600'
                : ''
            }`}
          >
            Route Radar
          </button>
          <button
            onClick={() => onTabChange('alerts')}
            className={`relative whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 dark:hover:text-white ${
              activeTab === 'alerts'
                ? 'text-rose-600 dark:text-rose-400 font-semibold underline underline-offset-8 decoration-2 decoration-rose-600'
                : ''
            }`}
          >
            <span>Active Alerts</span>
            {activeAlertsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                {activeAlertsCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenQuickSimulate}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-white active:scale-95 transition-all shadow-sm whitespace-nowrap shrink-0 min-h-[44px]"
            title="Simulate approaching bus to test live notification chime and alerts"
          >
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Simulate Approaching Bus</span>
          </button>
        </div>
      </div>
    </header>
  );
};
