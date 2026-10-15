import React from 'react';
import { POPULAR_SINGAPORE_ROUTES } from '../data/singaporeTransitData';
import { LiveBusVehicle } from '../types/transit';
import { MapPin, Navigation, Compass } from 'lucide-react';

interface LinearRouteViewProps {
  serviceNo: string;
  currentStopCode: string;
  vehicles: LiveBusVehicle[];
  onSelectStopCode?: (stopCode: string) => void;
}

export const LinearRouteView: React.FC<LinearRouteViewProps> = ({
  serviceNo,
  currentStopCode,
  vehicles,
  onSelectStopCode,
}) => {
  const route = POPULAR_SINGAPORE_ROUTES[serviceNo];
  if (!route) {
    return (
      <div className="p-4 text-center text-xs text-slate-500">
        Route diagram for Bus {serviceNo} is not mapped yet.
      </div>
    );
  }

  const currentStopIndex = route.stops.findIndex((s) => s.stopCode === currentStopCode);

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Route Progression · Bus {serviceNo}
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mt-0.5">
            {route.origin} → {route.destination}
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {route.stops.length} stops mapped
        </span>
      </div>

      {/* Linear Stop Sequence */}
      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300 dark:before:bg-slate-700">
        {route.stops.map((stop, idx) => {
          const isUserStop = stop.stopCode === currentStopCode;
          const isPassed = currentStopIndex !== -1 && idx < currentStopIndex;
          const isAhead = currentStopIndex !== -1 && idx > currentStopIndex;

          // Check if any vehicle is currently between this stop and next
          const busAtThisStop = vehicles.find(
            (v) => v.serviceNo === serviceNo && v.targetStopCode === stop.stopCode
          );

          return (
            <div key={stop.stopCode} className="relative flex items-start gap-3 text-xs">
              {/* Dot on vertical route line */}
              <div
                className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                  isUserStop
                    ? 'border-rose-600 bg-white dark:bg-slate-900 ring-4 ring-rose-400/30 z-20'
                    : isPassed
                    ? 'border-slate-400 bg-slate-300 dark:bg-slate-700'
                    : 'border-slate-400 bg-white dark:bg-slate-800'
                }`}
              >
                {isUserStop && <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />}
              </div>

              {/* Stop Information */}
              <div
                onClick={() => onSelectStopCode?.(stop.stopCode)}
                className={`flex-1 p-2 rounded-lg cursor-pointer transition-colors ${
                  isUserStop
                    ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 font-bold text-slate-900 dark:text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-slate-500">{stop.stopCode}</span>
                    <span className="truncate">{stop.stopName}</span>
                  </div>

                  {isUserStop && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-600 text-white">
                      Your Stop
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 truncate mt-0.5">{stop.road}</div>
              </div>

              {/* Bus vehicle marker at this segment */}
              {busAtThisStop && (
                <div className="absolute right-2 top-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-600 text-white shadow-sm font-mono text-[11px] animate-pulse">
                  <Navigation className="w-3 h-3" />
                  <span>Bus Here ({busAtThisStop.speedKmH} km/h)</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
