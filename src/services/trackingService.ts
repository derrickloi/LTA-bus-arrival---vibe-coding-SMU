import { BusArrivalData, LiveBusVehicle, NextBusInfo, BusStop } from '../types/transit';
import { SINGAPORE_BUS_STOPS, POPULAR_SINGAPORE_ROUTES } from '../data/singaporeTransitData';
import { notificationService } from './notificationService';

// Haversine formula to compute distance in meters between two [lat, lng] points
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Bearing calculation in degrees 0-360
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((bearing + 360) % 360);
}

interface SimulatedVehicleInternal extends LiveBusVehicle {
  routeServiceNo: string;
  currentStopIndex: number; // progress between stop points
  progressToNextStop: number; // 0.0 to 1.0
  speedFactor: number;
}

class TrackingService {
  private vehicles: SimulatedVehicleInternal[] = [];
  private timerId: number | null = null;
  private subscribers: (() => void)[] = [];
  private isSimulationPaused: boolean = false;
  private simulationSpeedMultiplier: number = 1.0;

  constructor() {
    this.initFleet();
    this.startTrackingLoop();
  }

  private initFleet() {
    this.vehicles = [];

    // Instantiate 2-3 buses per route
    Object.entries(POPULAR_SINGAPORE_ROUTES).forEach(([serviceNo, route]) => {
      const numStops = route.stops.length;
      if (numStops < 2) return;

      // Bus 1: about 30% through the route
      const stopIdx1 = Math.floor(numStops * 0.25);
      const stop1 = route.stops[stopIdx1];
      const nextStop1 = route.stops[Math.min(stopIdx1 + 1, numStops - 1)];

      this.vehicles.push({
        id: `SG-BUS-${serviceNo}-01`,
        serviceNo,
        operator: route.operator,
        routeServiceNo: serviceNo,
        lat: stop1.lat + (nextStop1.lat - stop1.lat) * 0.4,
        lng: stop1.lng + (nextStop1.lng - stop1.lng) * 0.4,
        bearing: calculateBearing(stop1.lat, stop1.lng, nextStop1.lat, nextStop1.lng),
        speedKmH: 34,
        load: serviceNo === '190' ? 'SDA' : 'SEA',
        type: serviceNo === '190' || serviceNo === '65' ? 'DD' : 'SD',
        wheelchairAccessible: true,
        targetStopCode: nextStop1.stopCode,
        nextStopName: nextStop1.stopName,
        destination: route.destination,
        currentStopIndex: stopIdx1,
        progressToNextStop: 0.4,
        speedFactor: 0.025,
      });

      // Bus 2: about 65% through the route
      if (numStops >= 4) {
        const stopIdx2 = Math.floor(numStops * 0.65);
        const stop2 = route.stops[stopIdx2];
        const nextStop2 = route.stops[Math.min(stopIdx2 + 1, numStops - 1)];

        this.vehicles.push({
          id: `SG-BUS-${serviceNo}-02`,
          serviceNo,
          operator: route.operator,
          routeServiceNo: serviceNo,
          lat: stop2.lat + (nextStop2.lat - stop2.lat) * 0.2,
          lng: stop2.lng + (nextStop2.lng - stop2.lng) * 0.2,
          bearing: calculateBearing(stop2.lat, stop2.lng, nextStop2.lat, nextStop2.lng),
          speedKmH: 28,
          load: serviceNo === '147' ? 'LSD' : 'SEA',
          type: 'DD',
          wheelchairAccessible: true,
          targetStopCode: nextStop2.stopCode,
          nextStopName: nextStop2.stopName,
          destination: route.destination,
          currentStopIndex: stopIdx2,
          progressToNextStop: 0.2,
          speedFactor: 0.02,
        });
      }

      // Bus 3: trailing near start (10% through route)
      const stop0 = route.stops[0];
      const nextStop0 = route.stops[1];
      this.vehicles.push({
        id: `SG-BUS-${serviceNo}-03`,
        serviceNo,
        operator: route.operator,
        routeServiceNo: serviceNo,
        lat: stop0.lat + (nextStop0.lat - stop0.lat) * 0.1,
        lng: stop0.lng + (nextStop0.lng - stop0.lng) * 0.1,
        bearing: calculateBearing(stop0.lat, stop0.lng, nextStop0.lat, nextStop0.lng),
        speedKmH: 38,
        load: 'SEA',
        type: 'SD',
        wheelchairAccessible: true,
        targetStopCode: nextStop0.stopCode,
        nextStopName: nextStop0.stopName,
        destination: route.destination,
        currentStopIndex: 0,
        progressToNextStop: 0.1,
        speedFactor: 0.028,
      });
    });
  }

  private startTrackingLoop() {
    if (typeof window === 'undefined') return;

    // Tick every 1500ms
    this.timerId = window.setInterval(() => {
      if (!this.isSimulationPaused) {
        this.stepSimulation();
      }
    }, 1500);
  }

  private stepSimulation() {
    this.vehicles.forEach((vehicle) => {
      const route = POPULAR_SINGAPORE_ROUTES[vehicle.routeServiceNo];
      if (!route || route.stops.length < 2) return;

      const numStops = route.stops.length;
      vehicle.progressToNextStop += vehicle.speedFactor * this.simulationSpeedMultiplier;

      if (vehicle.progressToNextStop >= 1.0) {
        vehicle.progressToNextStop = 0;
        vehicle.currentStopIndex += 1;

        if (vehicle.currentStopIndex >= numStops - 1) {
          // Loop back to start
          vehicle.currentStopIndex = 0;
        }
      }

      const currStop = route.stops[vehicle.currentStopIndex];
      const nextStop = route.stops[(vehicle.currentStopIndex + 1) % numStops];

      // Interpolate GPS coordinates
      const t = vehicle.progressToNextStop;
      vehicle.lat = currStop.lat + (nextStop.lat - currStop.lat) * t;
      vehicle.lng = currStop.lng + (nextStop.lng - currStop.lng) * t;
      vehicle.bearing = calculateBearing(currStop.lat, currStop.lng, nextStop.lat, nextStop.lng);
      vehicle.targetStopCode = nextStop.stopCode;
      vehicle.nextStopName = nextStop.stopName;

      // Fluctuate speed realistically
      vehicle.speedKmH = Math.max(18, Math.min(52, Math.round(30 + Math.sin(Date.now() / 5000 + vehicle.lat) * 12)));
    });

    // Notify UI subscribers
    this.subscribers.forEach((fn) => fn());
  }

  public subscribe(fn: () => void): () => void {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== fn);
    };
  }

  public getAllVehicles(): LiveBusVehicle[] {
    return this.vehicles;
  }

  public getVehiclesForRoute(serviceNo: string): LiveBusVehicle[] {
    return this.vehicles.filter((v) => v.serviceNo === serviceNo);
  }

  /**
   * Calculate real-time arrivals for a given bus stop
   */
  public getArrivalsForStop(stopCode: string): BusArrivalData[] {
    const stop = SINGAPORE_BUS_STOPS.find((s) => s.code === stopCode);
    if (!stop) return [];

    const results: BusArrivalData[] = [];

    stop.services.forEach((serviceNo) => {
      const route = POPULAR_SINGAPORE_ROUTES[serviceNo];
      if (!route) {
        // Fallback realistic arrival if route detail not fully populated
        results.push(this.createFallbackArrival(serviceNo, stop));
        return;
      }

      const stopIndexInRoute = route.stops.findIndex((s) => s.stopCode === stopCode);
      if (stopIndexInRoute === -1) {
        results.push(this.createFallbackArrival(serviceNo, stop));
        return;
      }

      // Find all vehicles on this route that are heading towards this stop
      const vehiclesOnRoute = this.vehicles.filter((v) => v.serviceNo === serviceNo);

      const arrivalsForVehicles: { vehicle: SimulatedVehicleInternal; stopsAway: number; distanceM: number; etaSeconds: number }[] = [];

      vehiclesOnRoute.forEach((v) => {
        let stopsAway = stopIndexInRoute - v.currentStopIndex;
        if (stopsAway < 0) {
          // Bus already passed, on next circuit
          stopsAway += route.stops.length;
        }

        const distanceM = calculateDistanceMeters(v.lat, v.lng, stop.lat, stop.lng);
        // Estimate seconds: based on distance and average 25km/h speed + 30s per intervening stop
        const travelSeconds = Math.max(10, Math.round((distanceM / 1000 / 26) * 3600) + stopsAway * 35);

        v.stopsAwayFromTarget = stopsAway;
        v.distanceToTarget = distanceM;
        v.etaSecondsToTarget = travelSeconds;

        arrivalsForVehicles.push({
          vehicle: v,
          stopsAway,
          distanceM,
          etaSeconds: travelSeconds,
        });

        // Trigger alert check
        notificationService.checkVehicleAgainstAlerts(v, stopCode, stop.name);
      });

      // Sort vehicles by ETA ascending
      arrivalsForVehicles.sort((a, b) => a.etaSeconds - b.etaSeconds);

      const bus1 = arrivalsForVehicles[0];
      const bus2 = arrivalsForVehicles[1];
      const bus3 = arrivalsForVehicles[2];

      const toNextBusInfo = (item?: { vehicle: SimulatedVehicleInternal; stopsAway: number; distanceM: number; etaSeconds: number }): NextBusInfo | undefined => {
        if (!item) return undefined;
        const minutes = Math.floor(item.etaSeconds / 60);
        return {
          busId: item.vehicle.id,
          estimatedArrivalMinutes: minutes,
          estimatedArrivalSeconds: item.etaSeconds,
          load: item.vehicle.load,
          type: item.vehicle.type,
          wheelchairAccessible: item.vehicle.wheelchairAccessible,
          latitude: item.vehicle.lat,
          longitude: item.vehicle.lng,
          speedKmH: item.vehicle.speedKmH,
          distanceMeters: item.distanceM,
          stopsAway: item.stopsAway,
        };
      };

      const nextBus1 = toNextBusInfo(bus1) || {
        busId: `SG-BUS-${serviceNo}-01`,
        estimatedArrivalMinutes: 3,
        estimatedArrivalSeconds: 180,
        load: 'SEA',
        type: 'DD',
        wheelchairAccessible: true,
        latitude: stop.lat + 0.003,
        longitude: stop.lng + 0.003,
        speedKmH: 30,
        distanceMeters: 450,
        stopsAway: 1,
      };

      results.push({
        serviceNo,
        operator: route.operator,
        originName: route.origin,
        destinationName: route.destination,
        nextBus: nextBus1,
        nextBus2: toNextBusInfo(bus2),
        nextBus3: toNextBusInfo(bus3),
      });
    });

    return results;
  }

  private createFallbackArrival(serviceNo: string, stop: BusStop): BusArrivalData {
    return {
      serviceNo,
      operator: 'SBS Transit',
      originName: 'Central Inter-Exchange',
      destinationName: 'Loop via Transit Corridors',
      nextBus: {
        busId: `SG-BUS-${serviceNo}-AUTO`,
        estimatedArrivalMinutes: 4,
        estimatedArrivalSeconds: 240,
        load: 'SEA',
        type: 'DD',
        wheelchairAccessible: true,
        latitude: stop.lat + 0.004,
        longitude: stop.lng + 0.004,
        speedKmH: 32,
        distanceMeters: 620,
        stopsAway: 1,
      },
      nextBus2: {
        busId: `SG-BUS-${serviceNo}-AUTO-2`,
        estimatedArrivalMinutes: 11,
        estimatedArrivalSeconds: 660,
        load: 'SDA',
        type: 'SD',
        wheelchairAccessible: true,
        latitude: stop.lat + 0.015,
        longitude: stop.lng + 0.012,
        speedKmH: 35,
        distanceMeters: 1850,
        stopsAway: 4,
      },
    };
  }

  /**
   * Fast Simulation Action: Trigger a bus approaching this stop immediately (within 280m / 35s)
   * This guarantees the user can test the live notification & proximity tracker in seconds!
   */
  public simulateBusApproachingNow(serviceNo: string, stopCode: string) {
    const route = POPULAR_SINGAPORE_ROUTES[serviceNo];
    const targetStop = SINGAPORE_BUS_STOPS.find((s) => s.code === stopCode);
    if (!targetStop) return;

    let vehicle = this.vehicles.find((v) => v.serviceNo === serviceNo);
    if (!vehicle) {
      // Create on the fly
      vehicle = {
        id: `SG-BUS-${serviceNo}-EXPRESS`,
        serviceNo,
        operator: route ? route.operator : 'SMRT',
        routeServiceNo: serviceNo,
        lat: targetStop.lat + 0.0018,
        lng: targetStop.lng + 0.0018,
        bearing: 215,
        speedKmH: 28,
        load: 'SDA',
        type: 'DD',
        wheelchairAccessible: true,
        targetStopCode: stopCode,
        nextStopName: targetStop.name,
        destination: route ? route.destination : 'Kampong Bahru Ter',
        currentStopIndex: 0,
        progressToNextStop: 0.85,
        speedFactor: 0.03,
      };
      this.vehicles.unshift(vehicle);
    } else {
      // Reposition vehicle right before target stop
      vehicle.lat = targetStop.lat + 0.0018; // approx 230 meters away
      vehicle.lng = targetStop.lng + 0.0018;
      vehicle.targetStopCode = stopCode;
      vehicle.nextStopName = targetStop.name;
      vehicle.progressToNextStop = 0.85;
      vehicle.speedKmH = 26;
      if (route) {
        const stopIdx = route.stops.findIndex((s) => s.stopCode === stopCode);
        if (stopIdx !== -1) {
          vehicle.currentStopIndex = Math.max(0, stopIdx - 1);
        }
      }
    }

    const dist = calculateDistanceMeters(vehicle.lat, vehicle.lng, targetStop.lat, targetStop.lng);
    vehicle.distanceToTarget = dist;
    vehicle.stopsAwayFromTarget = 1;
    vehicle.etaSecondsToTarget = 35; // 35 seconds

    // Run alerts check immediately
    notificationService.checkVehicleAgainstAlerts(vehicle, stopCode, targetStop.name);

    // Notify listeners
    this.subscribers.forEach((fn) => fn());
  }

  public setPaused(paused: boolean) {
    this.isSimulationPaused = paused;
  }

  public getPaused(): boolean {
    return this.isSimulationPaused;
  }

  public setSpeedMultiplier(multiplier: number) {
    this.simulationSpeedMultiplier = multiplier;
  }

  public getSpeedMultiplier(): number {
    return this.simulationSpeedMultiplier;
  }

  public resetSimulation() {
    this.initFleet();
    this.subscribers.forEach((fn) => fn());
  }
}

export const trackingService = new TrackingService();
