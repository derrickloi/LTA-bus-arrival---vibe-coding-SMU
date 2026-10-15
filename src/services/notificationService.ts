import { AlertSubscription, NotificationAlertEvent, LiveBusVehicle } from '../types/transit';
import { soundService } from './soundService';

const STORAGE_KEY_ALERTS = 'sg_bus_arrival_alerts_v1';

class NotificationService {
  private alerts: AlertSubscription[] = [];
  private listeners: ((alerts: AlertSubscription[]) => void)[] = [];
  private alertEventListeners: ((event: NotificationAlertEvent) => void)[] = [];

  constructor() {
    this.loadAlerts();
  }

  private loadAlerts() {
    if (typeof window === 'undefined') return;
    try {
      const data = localStorage.getItem(STORAGE_KEY_ALERTS);
      if (data) {
        this.alerts = JSON.parse(data);
      }
    } catch {
      this.alerts = [];
    }
  }

  private saveAlerts() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(this.alerts));
    } catch {
      // storage error fallback
    }
    this.notifySubscribers();
  }

  private notifySubscribers() {
    this.listeners.forEach((fn) => fn([...this.alerts]));
  }

  public subscribeAlerts(fn: (alerts: AlertSubscription[]) => void): () => void {
    this.listeners.push(fn);
    fn([...this.alerts]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public onAlertTriggered(fn: (event: NotificationAlertEvent) => void): () => void {
    this.alertEventListeners.push(fn);
    return () => {
      this.alertEventListeners = this.alertEventListeners.filter((l) => l !== fn);
    };
  }

  public async requestBrowserPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    return await Notification.requestPermission();
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public addAlert(subscription: Omit<AlertSubscription, 'id' | 'createdAt' | 'hasTriggered'>): AlertSubscription {
    // Remove duplicate if same service at same stop exists
    this.alerts = this.alerts.filter(
      (a) => !(a.serviceNo === subscription.serviceNo && a.stopCode === subscription.stopCode)
    );

    const newAlert: AlertSubscription = {
      ...subscription,
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      hasTriggered: false,
    };

    this.alerts.push(newAlert);
    this.saveAlerts();
    return newAlert;
  }

  public removeAlert(id: string) {
    this.alerts = this.alerts.filter((a) => a.id !== id);
    this.saveAlerts();
  }

  public getAlertForService(serviceNo: string, stopCode: string): AlertSubscription | undefined {
    return this.alerts.find((a) => a.serviceNo === serviceNo && a.stopCode === stopCode);
  }

  public getAlerts(): AlertSubscription[] {
    return [...this.alerts];
  }

  public checkVehicleAgainstAlerts(vehicle: LiveBusVehicle, currentStopCode: string, currentStopName: string) {
    this.alerts.forEach((alert) => {
      if (alert.serviceNo !== vehicle.serviceNo || alert.stopCode !== currentStopCode) {
        return;
      }

      if (alert.hasTriggered) {
        return; // Already triggered once for this bus session
      }

      const etaMin = vehicle.etaSecondsToTarget ? vehicle.etaSecondsToTarget / 60 : 0;
      const distanceM = vehicle.distanceToTarget ?? 9999;
      const stopsAway = vehicle.stopsAwayFromTarget ?? 99;

      let shouldTrigger = false;
      let thresholdDesc = '';

      if (alert.triggerType === 'eta_minutes' && etaMin <= alert.thresholdValue) {
        shouldTrigger = true;
        thresholdDesc = etaMin <= 1 ? 'arriving now (< 1 min)' : `approx. ${Math.round(etaMin)} mins away`;
      } else if (alert.triggerType === 'distance_meters' && distanceM <= alert.thresholdValue) {
        shouldTrigger = true;
        thresholdDesc = `${Math.round(distanceM)}m away`;
      } else if (alert.triggerType === 'stops_away' && stopsAway <= alert.thresholdValue) {
        shouldTrigger = true;
        thresholdDesc = stopsAway === 0 ? 'at your bus stop' : `${stopsAway} stop${stopsAway > 1 ? 's' : ''} away`;
      }

      if (shouldTrigger) {
        this.triggerAlert(alert, vehicle, currentStopName, thresholdDesc);
      }
    });
  }

  public triggerAlert(
    alert: AlertSubscription,
    vehicle: LiveBusVehicle,
    stopName: string,
    thresholdDesc: string
  ) {
    // Mark triggered
    alert.hasTriggered = true;
    alert.lastNotifiedAt = Date.now();
    this.saveAlerts();

    const title = `🚌 Bus ${alert.serviceNo} is Approaching!`;
    const body = `Bus ${alert.serviceNo} (${vehicle.operator}) is ${thresholdDesc} from ${stopName} (${alert.stopCode}).`;

    // 1. Audio chime
    if (alert.soundEnabled) {
      soundService.playApproachingChime();
    }

    // 2. Mobile vibration
    if (alert.vibrateEnabled && typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate([250, 100, 250]);
      } catch {
        // ignore
      }
    }

    // 3. Browser native notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: `sgbus-${alert.serviceNo}-${alert.stopCode}`,
        });
      } catch {
        // Notification constructor may throw on mobile Chrome PWA
      }
    }

    // 4. In-App event notification for UI toast/banner
    const event: NotificationAlertEvent = {
      id: `evt-${Date.now()}`,
      serviceNo: alert.serviceNo,
      stopCode: alert.stopCode,
      stopName,
      message: body,
      busVehicle: vehicle,
      timestamp: Date.now(),
    };

    this.alertEventListeners.forEach((fn) => fn(event));
  }

  public resetAlertTrigger(id: string) {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.hasTriggered = false;
      this.saveAlerts();
    }
  }

  public clearAllAlerts() {
    this.alerts = [];
    this.saveAlerts();
  }
}

export const notificationService = new NotificationService();
