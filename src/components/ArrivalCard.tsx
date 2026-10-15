import React, { useState } from 'react';
import { BusArrivalData, NextBusInfo, AlertSubscription } from '../types/transit';
import { LOAD_CONFIG, OPERATOR_COLORS } from '../data/singaporeTransitData';
import { Bell, BellRing, ChevronDown, ChevronUp, Navigation, Users, Accessibility, Layers } from 'lucide-react';

interface ArrivalCardProps {
  arrival: BusArrivalData;
  stopCode: string;
  activeAlert?: AlertSubscription;
  onOpenAlertModal: (serviceNo: string) => void;
  onRemoveAlert: (alertId: string) => void;
  onSelectRouteOnMap: (serviceNo: string) => void;
  onTrackVehicle: (vehicleId: string) => void;
  isExpandedRoute?: boolean;
  onToggleExpandRoute?: () => void;
}

export const ArrivalCard: React.FC<ArrivalCardProps> = ({
  arrival,
  activeAlert,
  onOpenAlertModal,
  onRemoveAlert,
  onSelectRouteOnMap,
  onTrackVehicle,
  isExpandedRoute = false,
  onToggleExpandRoute,
}) => {
  const operatorStyle = OPERATOR_COLORS[arrival.operator] || {
    bg: 'bg-slate-800',
    text: 'text-slate-800',
    badge: 'bg-slate-100 text-slate-800',
  };

  const renderBusPill = (bus: NextBusInfo | undefined, index: number) => {
    if (!bus) {
      return (
        <div className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
          <span className="text-xs text-slate-400 font-mono">-</span>
        </div>
      );
    }

    const isArriving = bus.estimatedArrivalMinutes <= 0 || bus.distanceMeters <= 120;
    const loadInfo = LOAD_CONFIG[bus.load];

    return (
      <div
        key={bus.busId || index}
        onClick={() => {
          if (bus.busId) onTrackVehicle(bus.busId);
        }}
        className={`flex-1 p-2.5 rounded-xl border transition-all cursor-pointer ${
          isArriving
            ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800 ring-1 ring-emerald-400/40'
            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {/* Arrival Time */}
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
            {index === 0 ? 'Next' : index === 1 ? '2nd' : '3rd'}
          </span>
          <span
            className={`font-mono text-sm sm:text-base font-bold tabular-nums ${
              isArriving
                ? 'text-emerald-700 dark:text-emerald-400 animate-pulse'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {isArriving ? 'Arr' : `${bus.estimatedArrivalMinutes}m`}
          </span>
        </div>

        {/* Load Bar & Deck indicator */}
        <div className="mt-1.5 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${loadInfo.barColor}`}
              title={loadInfo.label}
            />
            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
              {bus.type === 'DD' ? 'Double' : 'Single'}
            </span>
          </div>

          {bus.wheelchairAccessible && (
            <span title="Wheelchair Accessible" className="inline-flex">
              <Accessibility className="w-3 h-3 text-slate-400" />
            </span>
          )}
        </div>

        {/* Distance / ETA countdown */}
        <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
          {bus.distanceMeters < 1000
            ? `${bus.distanceMeters}m`
            : `${(bus.distanceMeters / 1000).toFixed(1)}km`}
          {bus.stopsAway > 0 ? ` · ${bus.stopsAway} stop${bus.stopsAway > 1 ? 's' : ''}` : ' · Here'}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 transition-all hover:shadow-sm">
      {/* Top Header of Card */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Big Bus Number Pill */}
          <div
            className={`w-14 h-11 rounded-xl flex items-center justify-center font-mono font-black text-lg text-white shadow-sm ${operatorStyle.bg} shrink-0`}
          >
            {arrival.serviceNo}
          </div>

          {/* Destination & Operator */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {arrival.operator}
              </span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate mt-0.5">
              To {arrival.destinationName}
            </div>
          </div>
        </div>

        {/* Right Action Icons: Alert Notification Bell & Map View */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              if (activeAlert) {
                onRemoveAlert(activeAlert.id);
              } else {
                onOpenAlertModal(arrival.serviceNo);
              }
            }}
            className={`p-2 rounded-xl border transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
              activeAlert
                ? 'bg-rose-600 border-rose-600 text-white shadow-sm shadow-rose-600/30 ring-2 ring-rose-300/60'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 hover:border-slate-300 dark:hover:text-white'
            }`}
            title={
              activeAlert
                ? `Alert Active! (Click to cancel notify for Bus ${arrival.serviceNo})`
                : `Notify me when Bus ${arrival.serviceNo} approaches`
            }
          >
            {activeAlert ? (
              <BellRing className="w-4 h-4 animate-bounce" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => onSelectRouteOnMap(arrival.serviceNo)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-200 dark:hover:text-rose-400 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            title={`View Bus ${arrival.serviceNo} live GPS tracking on map`}
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Next 3 Buses Arrival Cards Strip */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {renderBusPill(arrival.nextBus, 0)}
        {renderBusPill(arrival.nextBus2, 1)}
        {renderBusPill(arrival.nextBus3, 2)}
      </div>

      {/* Expand/Collapse Linear Route Bar */}
      {onToggleExpandRoute && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <button
            onClick={onToggleExpandRoute}
            className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>{isExpandedRoute ? 'Hide Route Progression' : 'Show Route Progression'}</span>
            {isExpandedRoute ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {activeAlert && (
            <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
              Tracking alert enabled
            </span>
          )}
        </div>
      )}
    </div>
  );
};
