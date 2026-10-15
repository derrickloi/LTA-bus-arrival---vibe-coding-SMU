import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BusStop, BusArrivalData, LiveBusVehicle, AlertSubscription, NotificationAlertEvent } from './types/transit';
import { SINGAPORE_BUS_STOPS, POPULAR_SINGAPORE_ROUTES } from './data/singaporeTransitData';
import { trackingService } from './services/trackingService';
import { notificationService } from './services/notificationService';
import { soundService } from './services/soundService';

import { TopNav } from './components/TopNav';
import { StopSelector } from './components/StopSelector';
import { ArrivalCard } from './components/ArrivalCard';
import { LiveTransitMap } from './components/LiveTransitMap';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { ApproachingBanner } from './components/ApproachingBanner';
import { LinearRouteView } from './components/LinearRouteView';
import { ActiveAlertsDrawer } from './components/ActiveAlertsDrawer';
import { SimulationControls } from './components/SimulationControls';

import { Bus, Map, Bell, Layers, Radio, RefreshCw, Volume2, Shield } from 'lucide-react';

export default function App() {
  const [selectedStop, setSelectedStop] = useState<BusStop>(SINGAPORE_BUS_STOPS[0]);
  const [selectedServiceNo, setSelectedServiceNo] = useState<string | null>(null);
  const [trackedVehicleId, setTrackedVehicleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'arrivals' | 'map' | 'routes' | 'alerts'>('arrivals');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('sg_bus_favorites');
      return stored ? JSON.parse(stored) : ['08057', '04168'];
    } catch {
      return ['08057', '04168'];
    }
  });

  const [alerts, setAlerts] = useState<AlertSubscription[]>([]);
  const [activeAlertEvent, setActiveAlertEvent] = useState<NotificationAlertEvent | null>(null);
  const [alertModalServiceNo, setAlertModalServiceNo] = useState<string | null>(null);
  const [isSimulationOpen, setIsSimulationOpen] = useState<boolean>(false);
  const [expandedRoutes, setExpandedRoutes] = useState<Record<string, boolean>>({});
  const [vehicles, setVehicles] = useState<LiveBusVehicle[]>([]);
  const [arrivals, setArrivals] = useState<BusArrivalData[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Subscribe to tracking updates
  const refreshArrivals = useCallback(() => {
    const arrs = trackingService.getArrivalsForStop(selectedStop.code);
    const vechs = trackingService.getAllVehicles();
    setArrivals(arrs);
    setVehicles([...vechs]);
    setLastRefreshed(new Date());
  }, [selectedStop.code]);

  useEffect(() => {
    refreshArrivals();
    const unsubscribe = trackingService.subscribe(() => {
      refreshArrivals();
    });
    return () => unsubscribe();
  }, [refreshArrivals]);

  // Subscribe to alert rules
  useEffect(() => {
    const unsubAlerts = notificationService.subscribeAlerts((savedAlerts) => {
      setAlerts(savedAlerts);
    });

    const unsubEvents = notificationService.onAlertTriggered((event) => {
      setActiveAlertEvent(event);
    });

    return () => {
      unsubAlerts();
      unsubEvents();
    };
  }, []);

  // Save favorites to localStorage
  const handleToggleFavorite = (stopCode: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(stopCode)
        ? prev.filter((c) => c !== stopCode)
        : [...prev, stopCode];
      try {
        localStorage.setItem('sg_bus_favorites', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    refreshArrivals();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleSelectRouteOnMap = (serviceNo: string) => {
    setSelectedServiceNo(serviceNo);
    setActiveTab('map');
  };

  const handleTrackVehicle = (vehicleId: string) => {
    setTrackedVehicleId(vehicleId);
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    if (vehicle) {
      setSelectedServiceNo(vehicle.serviceNo);
    }
    setActiveTab('map');
  };

  const handleToggleExpandRoute = (serviceNo: string) => {
    setExpandedRoutes((prev) => ({
      ...prev,
      [serviceNo]: !prev[serviceNo],
    }));
  };

  const handleSimulateApproaching = (serviceNo: string, stopCode: string) => {
    // If user has no alert for this service at this stop, auto-create one so they get alerted!
    const existing = alerts.find((a) => a.serviceNo === serviceNo && a.stopCode === stopCode);
    const targetStop = SINGAPORE_BUS_STOPS.find((s) => s.code === stopCode) || selectedStop;

    if (!existing) {
      notificationService.addAlert({
        serviceNo,
        stopCode,
        stopName: targetStop.name,
        triggerType: 'eta_minutes',
        thresholdValue: 3,
        soundEnabled: true,
        vibrateEnabled: true,
      });
    } else {
      notificationService.resetAlertTrigger(existing.id);
    }

    if (selectedStop.code !== stopCode) {
      setSelectedStop(targetStop);
    }

    setSelectedServiceNo(serviceNo);
    trackingService.simulateBusApproachingNow(serviceNo, stopCode);
  };

  // Find active alert for a service at current stop
  const getActiveAlert = (serviceNo: string) => {
    return alerts.find((a) => a.serviceNo === serviceNo && a.stopCode === selectedStop.code);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-rose-500/20 selection:text-rose-900 pb-20 md:pb-8">
      {/* Approaching Bus Live Heads-Up Banner */}
      <ApproachingBanner
        event={activeAlertEvent}
        onDismiss={() => setActiveAlertEvent(null)}
        onViewOnMap={(serviceNo, vehicleId) => {
          setSelectedServiceNo(serviceNo);
          setTrackedVehicleId(vehicleId);
          setActiveTab('map');
        }}
      />

      {/* Top Bar Contract (Wordmark - 4 Links - 1 Action) */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeAlertsCount={alerts.length}
        onOpenQuickSimulate={() => setIsSimulationOpen(true)}
      />

      {/* Hero / Quick Proximity Test Banner */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />
            <span>
              Real-time GPS transponders connected · Live approaching bus proximity radar active
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSimulateApproaching('190', selectedStop.code)}
              className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center gap-1.5 transition-colors"
              title="Test proximity alert chime for Bus 190 approaching this stop"
            >
              <span>Test Bus 190 Approaching (~35s)</span>
            </button>
            <button
              onClick={() => setIsSimulationOpen(true)}
              className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Simulation Lab
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Desktop Split Layout / Responsive Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Bus Stop Selector + Arrivals Feed / Routes / Alerts */}
          <div
            className={`lg:col-span-6 xl:col-span-5 space-y-4 ${
              activeTab === 'map' ? 'hidden lg:block' : 'block'
            }`}
          >
            {/* Bus Stop Selector */}
            <StopSelector
              stops={SINGAPORE_BUS_STOPS}
              selectedStop={selectedStop}
              onSelectStop={(stop) => {
                setSelectedStop(stop);
                setSelectedServiceNo(null);
                setTrackedVehicleId(null);
              }}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />

            {/* Sub-view Content Switcher (Arrivals vs Routes vs Alerts) */}
            {activeTab === 'alerts' ? (
              <ActiveAlertsDrawer
                alerts={alerts}
                vehicles={vehicles}
                onRemoveAlert={(id) => notificationService.removeAlert(id)}
                onClearAllAlerts={() => notificationService.clearAllAlerts()}
                onSimulateForAlert={handleSimulateApproaching}
                onViewOnMap={(serviceNo) => {
                  setSelectedServiceNo(serviceNo);
                  setActiveTab('map');
                }}
              />
            ) : activeTab === 'routes' ? (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                    Popular Singapore Bus Corridors
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(POPULAR_SINGAPORE_ROUTES).map((serviceNo) => (
                      <button
                        key={serviceNo}
                        onClick={() => setSelectedServiceNo(serviceNo)}
                        className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                          selectedServiceNo === serviceNo
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        Bus {serviceNo}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedServiceNo && (
                  <LinearRouteView
                    serviceNo={selectedServiceNo}
                    currentStopCode={selectedStop.code}
                    vehicles={vehicles}
                    onSelectStopCode={(code) => {
                      const st = SINGAPORE_BUS_STOPS.find((s) => s.code === code);
                      if (st) setSelectedStop(st);
                    }}
                  />
                )}
              </div>
            ) : (
              /* Default Arrivals Board View */
              <div className="space-y-3">
                {/* Board Refresh Status Bar */}
                <div className="flex items-center justify-between px-1 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>
                      Live Arrivals at {selectedStop.name} ({arrivals.length} services)
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    title="Refresh arrival times"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-600' : ''}`} />
                  </button>
                </div>

                {/* Bus Arrival Cards */}
                {arrivals.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400">
                    <Bus className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No active buses scheduled
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Check back shortly or select another Singapore bus interchange.
                    </p>
                  </div>
                ) : (
                  arrivals.map((arrival) => (
                    <div key={arrival.serviceNo} className="space-y-2">
                      <ArrivalCard
                        arrival={arrival}
                        stopCode={selectedStop.code}
                        activeAlert={getActiveAlert(arrival.serviceNo)}
                        onOpenAlertModal={(svc) => setAlertModalServiceNo(svc)}
                        onRemoveAlert={(id) => notificationService.removeAlert(id)}
                        onSelectRouteOnMap={handleSelectRouteOnMap}
                        onTrackVehicle={handleTrackVehicle}
                        isExpandedRoute={!!expandedRoutes[arrival.serviceNo]}
                        onToggleExpandRoute={() => handleToggleExpandRoute(arrival.serviceNo)}
                      />

                      {/* Expandable Route Diagram */}
                      {expandedRoutes[arrival.serviceNo] && (
                        <div className="pl-4 pr-1 animate-in fade-in duration-200">
                          <LinearRouteView
                            serviceNo={arrival.serviceNo}
                            currentStopCode={selectedStop.code}
                            vehicles={vehicles}
                            onSelectStopCode={(code) => {
                              const st = SINGAPORE_BUS_STOPS.find((s) => s.code === code);
                              if (st) setSelectedStop(st);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Column: Live Interactive Singapore Map */}
          <div
            className={`lg:col-span-6 xl:col-span-7 ${
              activeTab === 'arrivals' ? 'hidden lg:block' : 'block'
            }`}
          >
            <div className="sticky top-20 space-y-3">
              <div className="h-[460px] lg:h-[620px] w-full">
                <LiveTransitMap
                  stops={SINGAPORE_BUS_STOPS}
                  selectedStop={selectedStop}
                  onSelectStop={(stop) => {
                    setSelectedStop(stop);
                    setSelectedServiceNo(null);
                  }}
                  vehicles={vehicles}
                  selectedServiceNo={selectedServiceNo}
                  trackedVehicleId={trackedVehicleId}
                  onSelectVehicle={(v) => {
                    setTrackedVehicleId(v.id);
                    setSelectedServiceNo(v.serviceNo);
                  }}
                />
              </div>

              {/* Map Context Bar */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    Tracking {vehicles.length} Singapore buses in live motion
                  </span>
                  {selectedServiceNo && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-rose-600">
                        Filtering Route {selectedServiceNo}
                      </span>
                    </>
                  )}
                </div>

                {selectedServiceNo && (
                  <button
                    onClick={() => setSelectedServiceNo(null)}
                    className="text-xs text-rose-600 hover:underline font-medium"
                  >
                    Show All Routes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Pattern 1 from mobile design guide) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-4 items-center h-16 px-2">
          <button
            onClick={() => setActiveTab('arrivals')}
            className={`flex flex-col items-center justify-center min-h-[44px] ${
              activeTab === 'arrivals' ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500'
            }`}
          >
            <Bus className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Arrivals</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center justify-center min-h-[44px] ${
              activeTab === 'map' ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500'
            }`}
          >
            <Map className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Live Map</span>
          </button>

          <button
            onClick={() => setActiveTab('routes')}
            className={`flex flex-col items-center justify-center min-h-[44px] ${
              activeTab === 'routes' ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Routes</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`relative flex flex-col items-center justify-center min-h-[44px] ${
              activeTab === 'alerts' ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500'
            }`}
          >
            <Bell className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-1">Alerts</span>
            {alerts.length > 0 && (
              <span className="absolute top-2 right-6 w-2 h-2 rounded-full bg-rose-600" />
            )}
          </button>
        </div>
      </nav>

      {/* Alert Settings Modal */}
      {alertModalServiceNo && (
        <AlertSettingsModal
          isOpen={!!alertModalServiceNo}
          onClose={() => setAlertModalServiceNo(null)}
          serviceNo={alertModalServiceNo}
          stop={selectedStop}
          existingAlert={getActiveAlert(alertModalServiceNo)}
          onSaved={() => {
            refreshArrivals();
          }}
        />
      )}

      {/* Simulation Controls Modal */}
      <SimulationControls
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        stops={SINGAPORE_BUS_STOPS}
        currentStop={selectedStop}
        onSimulateApproaching={handleSimulateApproaching}
      />
    </div>
  );
}
