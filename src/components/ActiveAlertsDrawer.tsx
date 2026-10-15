import React from 'react';
import { AlertSubscription, LiveBusVehicle } from '../types/transit';
import { Bell, BellOff, Volume2, Trash2, Radio, Navigation, CheckCircle } from 'lucide-react';

interface ActiveAlertsDrawerProps {
  alerts: AlertSubscription[];
  vehicles: LiveBusVehicle[];
  onRemoveAlert: (alertId: string) => void;
  onClearAllAlerts: () => void;
  onSimulateForAlert: (serviceNo: string, stopCode: string) => void;
  onViewOnMap: (serviceNo: string) => void;
  onClose?: () => void;
}

export const ActiveAlertsDrawer: React.FC<ActiveAlertsDrawerProps> = ({
  alerts,
  vehicles,
  onRemoveAlert,
  onClearAllAlerts,
  onSimulateForAlert,
  onViewOnMap,
  onClose,
}) => {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Active Proximity Alerts
            </h3>
            <p className="text-xs text-slate-500">
              Monitoring real-time GPS locations & approaching thresholds
            </p>
          </div>
        </div>

        {alerts.length > 0 && (
          <button
            onClick={onClearAllAlerts}
            className="text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-medium transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="py-8 text-center text-slate-400">
          <BellOff className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No Active Bus Alerts
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Click the bell icon on any bus arrival card to get alerted with sound chimes and notifications when your bus approaches!
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {alerts.map((alert) => {
            // Find live vehicle matching this service
            const liveVehicle = vehicles.find((v) => v.serviceNo === alert.serviceNo);
            const dist = liveVehicle?.distanceToTarget;
            const etaMins = liveVehicle?.etaSecondsToTarget
              ? Math.round(liveVehicle.etaSecondsToTarget / 60)
              : null;

            return (
              <div
                key={alert.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-10 rounded-lg bg-rose-600 text-white font-mono font-bold text-base flex items-center justify-center shadow-sm shrink-0">
                    {alert.serviceNo}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {alert.stopName}
                      </span>
                      <span className="text-xs font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {alert.stopCode}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>
                        Rule: ≤ {alert.thresholdValue}{' '}
                        {alert.triggerType === 'eta_minutes'
                          ? 'mins away'
                          : alert.triggerType === 'distance_meters'
                          ? 'm away'
                          : 'stops away'}
                      </span>
                      {alert.soundEnabled && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <Volume2 className="w-3 h-3" /> Chime
                          </span>
                        </>
                      )}
                    </div>

                    {/* Live status */}
                    <div className="mt-1 text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      {alert.hasTriggered ? (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approaching threshold reached
                        </span>
                      ) : dist !== undefined ? (
                        <span className="text-slate-700 dark:text-slate-300">
                          Live: {dist}m away · ~{etaMins}m
                        </span>
                      ) : (
                        <span>Tracking bus coordinates...</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => onSimulateForAlert(alert.serviceNo, alert.stopCode)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs font-medium transition-colors"
                    title="Simulate this bus approaching now (~35s away) to test notification"
                  >
                    <Radio className="w-3 h-3 text-rose-500 animate-pulse" />
                    <span>Test Approach</span>
                  </button>

                  <button
                    onClick={() => onViewOnMap(alert.serviceNo)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors"
                    title="View on Map"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onRemoveAlert(alert.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove Alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
