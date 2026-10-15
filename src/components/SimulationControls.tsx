import React, { useState } from 'react';
import { BusStop } from '../types/transit';
import { trackingService } from '../services/trackingService';
import { soundService } from '../services/soundService';
import { Play, Pause, RotateCcw, FastForward, Radio, Volume2, X } from 'lucide-react';

interface SimulationControlsProps {
  isOpen: boolean;
  onClose: () => void;
  stops: BusStop[];
  currentStop: BusStop;
  onSimulateApproaching: (serviceNo: string, stopCode: string) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isOpen,
  onClose,
  stops,
  currentStop,
  onSimulateApproaching,
}) => {
  const [selectedService, setSelectedService] = useState<string>(currentStop.services[0] || '190');
  const [selectedStopCode, setSelectedStopCode] = useState<string>(currentStop.code);
  const [isPaused, setIsPaused] = useState<boolean>(trackingService.getPaused());
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(trackingService.getSpeedMultiplier());

  if (!isOpen) return null;

  const handleTogglePause = () => {
    const next = !isPaused;
    trackingService.setPaused(next);
    setIsPaused(next);
  };

  const handleSpeedChange = (mult: number) => {
    trackingService.setSpeedMultiplier(mult);
    setSpeedMultiplier(mult);
  };

  const handleReset = () => {
    trackingService.resetSimulation();
  };

  const handleTrigger = () => {
    onSimulateApproaching(selectedService, selectedStopCode);
    onClose();
  };

  const availableServices = stops.find((s) => s.code === selectedStopCode)?.services || ['190', '65', '147'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
              <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Live Simulation & Proximity Testing Lab
              </h3>
              <p className="text-xs text-slate-500">
                Test real-time bus location telemetry & notification triggers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Fast Approach Test */}
        <div className="mt-4 p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900 dark:text-rose-200 flex items-center gap-1.5 mb-2">
            <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            Instant Approaching Test
          </h4>
          <p className="text-xs text-rose-700 dark:text-rose-300 mb-3">
            Teleports a bus to ~250m before your chosen stop so you can immediately see the approaching alert, hear the transit chime, and track it live.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Target Bus Stop
              </label>
              <select
                value={selectedStopCode}
                onChange={(e) => {
                  setSelectedStopCode(e.target.value);
                  const st = stops.find((s) => s.code === e.target.value);
                  if (st && st.services.length > 0) {
                    setSelectedService(st.services[0]);
                  }
                }}
                className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {stops.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Bus Service
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full h-9 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                {availableServices.map((svc) => (
                  <option key={svc} value={svc}>
                    Bus {svc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleTrigger}
            className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Radio className="w-4 h-4 animate-ping" />
            <span>Simulate Bus {selectedService} Approaching Now</span>
          </button>
        </div>

        {/* Playback Controls */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Simulation Playback</span>
            <span>Speed: {speedMultiplier}x</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePause}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 transition-colors ${
                isPaused
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              <span>{isPaused ? 'Resume Simulation' : 'Pause Simulation'}</span>
            </button>

            {[1, 2, 5].map((mult) => (
              <button
                key={mult}
                onClick={() => handleSpeedChange(mult)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  speedMultiplier === mult
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {mult}x
              </button>
            ))}

            <button
              onClick={handleReset}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              title="Reset fleet positions"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audio Test button */}
        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
          <span className="text-slate-600 dark:text-slate-300">
            Audio Synthesizer (Singapore Public Transit Chime)
          </span>
          <button
            onClick={() => soundService.playApproachingChime()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 font-medium"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Play Chime</span>
          </button>
        </div>
      </div>
    </div>
  );
};
