import React, { useState, useEffect } from 'react';
import { BusStop, AlertSubscription } from '../types/transit';
import { notificationService } from '../services/notificationService';
import { soundService } from '../services/soundService';
import { trackingService } from '../services/trackingService';
import { Bell, Volume2, Smartphone, ShieldCheck, X, Check, Play, Radio } from 'lucide-react';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceNo: string;
  stop: BusStop;
  existingAlert?: AlertSubscription;
  onSaved: () => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  serviceNo,
  stop,
  existingAlert,
  onSaved,
}) => {
  const [triggerType, setTriggerType] = useState<'eta_minutes' | 'distance_meters' | 'stops_away'>(
    existingAlert?.triggerType || 'eta_minutes'
  );
  const [thresholdValue, setThresholdValue] = useState<number>(
    existingAlert?.thresholdValue || 3
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(
    existingAlert?.soundEnabled ?? true
  );
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(
    existingAlert?.vibrateEnabled ?? true
  );
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    setPermissionStatus(notificationService.getPermissionStatus());
    if (existingAlert) {
      setTriggerType(existingAlert.triggerType);
      setThresholdValue(existingAlert.thresholdValue);
      setSoundEnabled(existingAlert.soundEnabled);
      setVibrateEnabled(existingAlert.vibrateEnabled);
    } else {
      setTriggerType('eta_minutes');
      setThresholdValue(3);
      setSoundEnabled(true);
      setVibrateEnabled(true);
    }
  }, [existingAlert, isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await notificationService.requestBrowserPermission();
    setPermissionStatus(res);
  };

  const handleTestChime = () => {
    soundService.playApproachingChime();
  };

  const handleSave = () => {
    notificationService.addAlert({
      serviceNo,
      stopCode: stop.code,
      stopName: stop.name,
      triggerType,
      thresholdValue,
      soundEnabled,
      vibrateEnabled,
    });
    onSaved();
    onClose();
  };

  const handleSimulateImmediately = () => {
    // First save the alert
    notificationService.addAlert({
      serviceNo,
      stopCode: stop.code,
      stopName: stop.name,
      triggerType,
      thresholdValue,
      soundEnabled,
      vibrateEnabled,
    });
    onSaved();
    // Then trigger fast approach
    trackingService.simulateBusApproachingNow(serviceNo, stop.code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Track Bus {serviceNo}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Approaching {stop.name} ({stop.code})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trigger Mode Segmented Selection */}
        <div className="mt-6">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Notify Me When Bus Is:
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTriggerType('eta_minutes');
                setThresholdValue(3);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-all ${
                triggerType === 'eta_minutes'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              By Minutes
            </button>
            <button
              type="button"
              onClick={() => {
                setTriggerType('distance_meters');
                setThresholdValue(500);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-all ${
                triggerType === 'distance_meters'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              By Distance
            </button>
            <button
              type="button"
              onClick={() => {
                setTriggerType('stops_away');
                setThresholdValue(1);
              }}
              className={`py-2 text-xs font-medium rounded-lg transition-all ${
                triggerType === 'stops_away'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              By Stops Away
            </button>
          </div>

          {/* Threshold value selectors */}
          <div className="mt-3">
            {triggerType === 'eta_minutes' && (
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 5].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setThresholdValue(mins)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                      thresholdValue === mins
                        ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {mins === 1 ? 'Arriving (< 1 min)' : `${mins} mins away`}
                  </button>
                ))}
              </div>
            )}

            {triggerType === 'distance_meters' && (
              <div className="grid grid-cols-3 gap-2">
                {[300, 500, 1000].map((dist) => (
                  <button
                    key={dist}
                    type="button"
                    onClick={() => setThresholdValue(dist)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                      thresholdValue === dist
                        ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {dist < 1000 ? `${dist}m away` : '1.0 km away'}
                  </button>
                ))}
              </div>
            )}

            {triggerType === 'stops_away' && (
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((stops) => (
                  <button
                    key={stops}
                    type="button"
                    onClick={() => setThresholdValue(stops)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                      thresholdValue === stops
                        ? 'border-rose-600 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 font-semibold ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {stops === 0 ? 'At current stop' : `${stops} stop away`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Feedback Options: Sound & Vibration */}
        <div className="mt-5 space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Play Transit Arrival Chime
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestChime}
                className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 flex items-center gap-1"
                title="Preview sound chime"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Test</span>
              </button>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                Device Vibration
              </span>
            </div>
            <input
              type="checkbox"
              checked={vibrateEnabled}
              onChange={(e) => setVibrateEnabled(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
            />
          </div>

          {/* Browser Notification Status */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                {permissionStatus === 'granted'
                  ? 'Browser notifications enabled'
                  : 'Desktop & mobile system alerts'}
              </span>
            </div>
            {permissionStatus !== 'granted' && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/60 rounded-lg whitespace-nowrap"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="w-full h-11 bg-rose-600 text-white font-semibold text-sm rounded-xl hover:bg-rose-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm shadow-rose-600/30"
          >
            <Check className="w-4 h-4" />
            <span>Start Tracking Bus {serviceNo}</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateImmediately}
            className="w-full h-10 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
          >
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Set Alert & Test Approaching Now (~35s away)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
