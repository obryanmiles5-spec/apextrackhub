export type ShipmentStatus = 'received' | 'transit' | 'customs' | 'out_for_delivery' | 'delivered';

export type CarrierType = 'Apex Logistics' | 'FedEx' | 'DHL Global' | 'UPS Transport' | 'USPS Priority' | 'Oceanic Cargo' | 'Swift Express Cargo';

export type ShippingMethod = 'Ground Transport' | 'Express Delivery' | 'Air Freight' | 'Sea Cargo';

export interface ShipmentHistoryItem {
  id: string;
  timestamp: string;
  location: string;
  description: string;
  status: ShipmentStatus;
}

export interface Shipment {
  id: string; // Tracking Number (e.g., US-9482-9018)
  senderName: string;
  senderAddress: string;
  senderEmail?: string;
  senderPhone?: string;
  receiverName: string;
  receiverAddress: string;
  receiverEmail?: string;
  receiverPhone?: string;
  originCity: string;
  originCountry: string;
  destinationCity: string;
  destinationCountry: string;
  status: ShipmentStatus;
  carrier: CarrierType;
  shippingMethod: ShippingMethod;
  weight: number; // in lbs
  dimensions: string; // e.g., 20x15x10 in
  estimatedDelivery: string; // Date string
  isActive: boolean;
  visibility: 'visible' | 'hidden';
  history: ShipmentHistoryItem[];
  cargoValue?: number; // USD
  notes?: string;
  email?: string;
}
