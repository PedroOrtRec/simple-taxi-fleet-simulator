import {Shift, Vehicle} from '../models';

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

export interface FareCalculatorService {
  calculateDistance(origin: GeoPoint, destination: GeoPoint): number;
  estimateFare(distanceKm: number): number;
  findClosestVehicle(
    pickup: GeoPoint,
    availableVehicles: Vehicle[],
  ): ClosestVehicleResult | null;
}

export interface CreateShiftRequest {
  clientName: string;
  from: string;
  to?: string;
}

export interface ShiftService {
  request(data: CreateShiftRequest): Promise<Shift>;
  getById(id: number): Promise<Shift>;
  accept(id: number, driverId: number): Promise<Shift>;
  complete(id: number, to?: string): Promise<Shift>;
}
