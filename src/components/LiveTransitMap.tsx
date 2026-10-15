import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BusStop, LiveBusVehicle, BusRouteInfo } from '../types/transit';
import { POPULAR_SINGAPORE_ROUTES } from '../data/singaporeTransitData';
import { Crosshair, Eye, Compass } from 'lucide-react';

interface LiveTransitMapProps {
  stops: BusStop[];
  selectedStop: BusStop;
  onSelectStop: (stop: BusStop) => void;
  vehicles: LiveBusVehicle[];
  selectedServiceNo: string | null;
  trackedVehicleId: string | null;
  onSelectVehicle?: (vehicle: LiveBusVehicle) => void;
}

export const LiveTransitMap: React.FC<LiveTransitMapProps> = ({
  stops,
  selectedStop,
  onSelectStop,
  vehicles,
  selectedServiceNo,
  trackedVehicleId,
  onSelectVehicle,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const stopMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const busMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const routePolylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const userRadarMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [selectedStop.lat, selectedStop.lng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false,
    });

    // Clean, high-legibility OpenStreetMap or CartoDB tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Add minimal attribution in small text
    L.control
      .attribution({
        position: 'bottomright',
        prefix: '<span>© OpenStreetMap · LTA DataMall</span>',
      })
      .addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polylines
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous polylines
    routePolylinesRef.current.forEach((polyline) => polyline.remove());
    routePolylinesRef.current.clear();

    const routesToDraw: BusRouteInfo[] = selectedServiceNo
      ? [POPULAR_SINGAPORE_ROUTES[selectedServiceNo]].filter(Boolean)
      : Object.values(POPULAR_SINGAPORE_ROUTES);

    routesToDraw.forEach((route) => {
      if (route.stops.length < 2) return;
      const latlngs: L.LatLngExpression[] = route.stops.map((s) => [s.lat, s.lng]);

      const polyline = L.polyline(latlngs, {
        color: route.color || '#2563EB',
        weight: selectedServiceNo === route.serviceNo ? 5 : 3,
        opacity: selectedServiceNo === route.serviceNo ? 0.9 : 0.45,
        dashArray: selectedServiceNo === route.serviceNo ? undefined : '6, 6',
      }).addTo(map);

      routePolylinesRef.current.set(route.serviceNo, polyline);
    });
  }, [selectedServiceNo]);

  // Update Bus Stop Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    stops.forEach((stop) => {
      const isSelected = stop.code === selectedStop.code;
      let marker = stopMarkersRef.current.get(stop.code);

      const html = `
        <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-20'
        }">
          <div class="w-8 h-8 rounded-full flex items-center justify-center ${
            isSelected
              ? 'bg-rose-600 text-white shadow-lg ring-4 ring-rose-300/60'
              : 'bg-slate-900 text-white shadow-md ring-2 ring-white'
          }">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
            </svg>
          </div>
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none ${
            isSelected ? 'opacity-100 ring-1 ring-rose-400' : 'opacity-85'
          }">
            ${stop.code}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'bus-stop-div-icon',
        html,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (!marker) {
        marker = L.marker([stop.lat, stop.lng], { icon }).addTo(map);
        marker.on('click', () => {
          onSelectStop(stop);
        });
        stopMarkersRef.current.set(stop.code, marker);
      } else {
        marker.setIcon(icon);
        marker.setLatLng([stop.lat, stop.lng]);
      }
    });
  }, [stops, selectedStop, onSelectStop]);

  // Update Live Vehicles Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Filter vehicles if route selected
    const visibleVehicles = selectedServiceNo
      ? vehicles.filter((v) => v.serviceNo === selectedServiceNo)
      : vehicles;

    // Remove deleted vehicles
    const currentIds = new Set(visibleVehicles.map((v) => v.id));
    busMarkersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        busMarkersRef.current.delete(id);
      }
    });

    visibleVehicles.forEach((v) => {
      const isTracked = v.id === trackedVehicleId;
      let marker = busMarkersRef.current.get(v.id);

      // Distinct operator brand color
      let operatorBg = 'bg-rose-600';
      if (v.operator === 'SBS Transit') operatorBg = 'bg-purple-700';
      if (v.operator === 'Tower Transit') operatorBg = 'bg-emerald-600';
      if (v.operator === 'Go-Ahead') operatorBg = 'bg-amber-600';

      const html = `
        <div class="relative group cursor-pointer ${isTracked ? 'z-50' : 'z-30'}">
          ${
            isTracked
              ? '<span class="absolute -inset-2 rounded-full bg-rose-500/40 animate-ping"></span>'
              : ''
          }
          <div class="flex items-center gap-1 px-2 py-1 rounded-full text-white shadow-lg font-bold text-xs ${operatorBg} ${
            isTracked ? 'ring-2 ring-white shadow-rose-500/50 scale-110' : 'ring-1 ring-white/80'
          } transition-all duration-300">
            <span class="tracking-tight font-mono">${v.serviceNo}</span>
            <div style="transform: rotate(${v.bearing}deg);" class="transition-transform duration-300">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
              </svg>
            </div>
            ${v.type === 'DD' ? '<span class="text-[9px] bg-white/20 px-1 rounded">DD</span>' : ''}
          </div>
          <div class="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.2 rounded font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            ${v.speedKmH} km/h · ${v.nextStopName}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'live-bus-div-icon',
        html,
        iconSize: [52, 28],
        iconAnchor: [26, 14],
      });

      if (!marker) {
        marker = L.marker([v.lat, v.lng], { icon }).addTo(map);
        marker.on('click', () => {
          onSelectVehicle?.(v);
        });
        busMarkersRef.current.set(v.id, marker);
      } else {
        marker.setIcon(icon);
        marker.setLatLng([v.lat, v.lng]);
      }
    });
  }, [vehicles, selectedServiceNo, trackedVehicleId, onSelectVehicle]);

  // Center on selected stop or tracked vehicle
  const handleCenterOnStop = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([selectedStop.lat, selectedStop.lng], 16, { duration: 0.8 });
    }
  };

  const handleCenterOnTrackedBus = () => {
    const map = mapInstanceRef.current;
    if (!map || !trackedVehicleId) return;
    const tracked = vehicles.find((v) => v.id === trackedVehicleId);
    if (tracked) {
      map.flyTo([tracked.lat, tracked.lng], 17, { duration: 0.8 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[350px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-sm">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Action Pill Bar */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-xs">
        <button
          onClick={handleCenterOnStop}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
          title="Center on Selected Stop"
        >
          <Crosshair className="w-3.5 h-3.5 text-rose-600" />
          <span>Stop {selectedStop.code}</span>
        </button>

        {trackedVehicleId && (
          <button
            onClick={handleCenterOnTrackedBus}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 font-medium hover:bg-rose-100 transition-colors"
            title="Follow Approaching Bus"
          >
            <Compass className="w-3.5 h-3.5 text-rose-600 animate-spin" />
            <span>Track Bus</span>
          </button>
        )}
      </div>

      {/* Map Legend Overlay in bottom left */}
      <div className="absolute bottom-3 left-3 z-20 hidden sm:flex items-center gap-3 px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
          <span>SMRT</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-700" />
          <span>SBS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span>Tower</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
          <span>Go-Ahead</span>
        </div>
      </div>
    </div>
  );
};
