import React from 'react';
import { NotificationAlertEvent } from '../types/transit';
import { Bell, Navigation, CheckCheck, X } from 'lucide-react';

interface ApproachingBannerProps {
  event: NotificationAlertEvent | null;
  onDismiss: () => void;
  onViewOnMap: (serviceNo: string, vehicleId: string) => void;
}

export const ApproachingBanner: React.FC<ApproachingBannerProps> = ({
  event,
  onDismiss,
  onViewOnMap,
}) => {
  if (!event) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-rose-500/50 ring-4 ring-rose-500/20 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute -inset-1 rounded-xl bg-rose-500 animate-ping opacity-75" />
              <div className="relative w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white font-mono font-bold text-base shadow-md">
                {event.serviceNo}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-rose-400 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5" />
                  Approaching Bus Alert
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Just now</span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                Bus {event.serviceNo} is near {event.stopName}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 font-mono">
                {event.busVehicle.distanceToTarget
                  ? `${event.busVehicle.distanceToTarget}m away · ${event.busVehicle.speedKmH} km/h`
                  : 'Approaching your stop right now'}
              </p>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={() => {
              onViewOnMap(event.serviceNo, event.busVehicle.id);
              onDismiss();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-500 transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Track on Live Map</span>
          </button>
          <button
            onClick={onDismiss}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Dismiss</span>
          </button>
        </div>
      </div>
    </div>
  );
};
