export type BusOperator = 'SBS Transit' | 'SMRT' | 'Tower Transit' | 'Go-Ahead';

export type BusLoad = 'SEA' | 'SDA' | 'LSD'; // Seats Available (Green), Standing Available (Amber), Limited Standing (Red)

export type BusType = 'SD' | 'DD' | 'BD'; // Single Deck, Double Deck, Bendy

export interface NextBusInfo {
  busId: string;
  estimatedArrivalMinutes: number; // in minutes, 0 = 'Arr'
  estimatedArrivalSeconds: number; // live countdown
  load: BusLoad;
  type: BusType;
  wheelchairAccessible: boolean;
  latitude: number;
  longitude: number;
  speedKmH: number;
  distanceMeters: number; // distance to current stop
  stopsAway: number;
}

export interface BusArrivalData {
  serviceNo: string;
  operator: BusOperator;
  destinationName: string;
  originName: string;
  nextBus: NextBusInfo;
  nextBus2?: NextBusInfo;
  nextBus3?: NextBusInfo;
}

export interface BusStop {
  code: string; // 5-digit code e.g. "08057"
  name: string; // e.g. "Dhoby Ghaut Stn"
  road: string; // e.g. "Orchard Rd"
  lat: number;
  lng: number;
  services: string[]; // e.g. ["190", "65", "174", "851"]
  mrtLines?: ('NSL' | 'EWL' | 'NEL' | 'CCL' | 'DTL' | 'TEL')[];
  description?: string;
}

export interface LiveBusVehicle {
  id: string;
  serviceNo: string;
  operator: BusOperator;
  lat: number;
  lng: number;
  bearing: number; // heading in degrees 0-360
  speedKmH: number;
  load: BusLoad;
  type: BusType;
  wheelchairAccessible: boolean;
  targetStopCode: string;
  nextStopName: string;
  destination: string;
  stopsAwayFromTarget?: number;
  distanceToTarget?: number;
  etaSecondsToTarget?: number;
}

export interface AlertSubscription {
  id: string;
  serviceNo: string;
  stopCode: string;
  stopName: string;
  triggerType: 'eta_minutes' | 'distance_meters' | 'stops_away';
  thresholdValue: number; // e.g. 3 (minutes), 500 (meters), or 2 (stops)
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  createdAt: number;
  lastNotifiedAt?: number;
  hasTriggered: boolean;
}

export interface NotificationAlertEvent {
  id: string;
  serviceNo: string;
  stopCode: string;
  stopName: string;
  message: string;
  busVehicle: LiveBusVehicle;
  timestamp: number;
}

export interface RouteStopPoint {
  stopCode: string;
  stopName: string;
  road: string;
  lat: number;
  lng: number;
  sequence: number;
}

export interface BusRouteInfo {
  serviceNo: string;
  operator: BusOperator;
  origin: string;
  destination: string;
  color: string;
  stops: RouteStopPoint[];
}
