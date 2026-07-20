import { Shipment } from '../types';

export const INITIAL_SHIPMENTS: Shipment[] = [];

const LOCAL_STORAGE_KEY = 'us_logistics_shipments';

export function getShipments(): Shipment[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_SHIPMENTS));
    return INITIAL_SHIPMENTS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse shipments from localStorage', e);
    return INITIAL_SHIPMENTS;
  }
}

export function saveShipments(shipments: Shipment[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(shipments));
}

export function getShipmentByTrackingNumber(trackingNumber: string): Shipment | undefined {
  const shipments = getShipments();
  const normalizedSearch = trackingNumber.trim().toUpperCase();
  return shipments.find(s => s.id.toUpperCase() === normalizedSearch);
}
