import {Vehicle} from '../models';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface GeocodeResult {
  displayName: string;
  point: GeoPoint;
  boundingBox?: string[];
}

export interface GeocoderService {
  geocode(address: string): Promise<GeocodeResult[]>;
  reverseGeocode(latitude: number, longitude: number): Promise<string>;
}

export interface ClosestVehicleResult {
  vehicle: Vehicle;
  distanceKm: number;
  estimatedArrivalMinutes: number;
}

export interface CreateShiftRequest {
  clientName: string;
  from: string;
  to?: string;
}

export interface CompleteShiftPayload {
  fare?: number;
  to?: string;
}
