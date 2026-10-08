import {bind, BindingScope} from '@loopback/core';
import {Vehicle} from '../models';
import {GeoPoint, ClosestVehicleResult} from './types';

export const FARE_CONSTANTS = {
  EARTH_RADIUS_KM: 6371,
  BASE_FARE: 2.5,
  PRICE_PER_KM: 1.2,
  MIN_FARE: 4.0,
  AVERAGE_URBAN_SPEED_KM_PER_HOUR: 30,
};

@bind({scope: BindingScope.SINGLETON})
export class FareCalculatorService {
  /**
   * Calculates the great-circle distance between two coordinates in kilometers
   * using the Haversine formula.
   */
  calculateDistance(origin: GeoPoint, destination: GeoPoint): number {
    const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

    const lat1 = toRadians(origin.latitude);
    const lon1 = toRadians(origin.longitude);
    const lat2 = toRadians(destination.latitude);
    const lon2 = toRadians(destination.longitude);

    const deltaLat = lat2 - lat1;
    const deltaLon = lon2 - lon1;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(deltaLon / 2) *
        Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = FARE_CONSTANTS.EARTH_RADIUS_KM * c;

    return Math.round(distance * 100) / 100;
  }

  /**
   * Estimates the fare for a trip based on distance.
   */
  estimateFare(distanceKm: number): number {
    const calculatedFare =
      FARE_CONSTANTS.BASE_FARE + distanceKm * FARE_CONSTANTS.PRICE_PER_KM;
    const finalFare = Math.max(calculatedFare, FARE_CONSTANTS.MIN_FARE);
    return Math.round(finalFare * 100) / 100;
  }

  /**
   * Finds the closest available vehicle to a pickup coordinate and estimates arrival time.
   */
  findClosestVehicle(
    pickup: GeoPoint,
    availableVehicles: Vehicle[],
  ): ClosestVehicleResult | null {
    const validVehicles = availableVehicles.filter(
      v => typeof v.latitude === 'number' && typeof v.longitude === 'number',
    );

    if (validVehicles.length === 0) {
      return null;
    }

    let closestVehicle: Vehicle = validVehicles[0];
    let minDistance = Infinity;

    for (const vehicle of validVehicles) {
      const distance = this.calculateDistance(pickup, {
        latitude: vehicle.latitude!,
        longitude: vehicle.longitude!,
      });

      if (distance < minDistance) {
        minDistance = distance;
        closestVehicle = vehicle;
      }
    }

    const speedKmPerMin = FARE_CONSTANTS.AVERAGE_URBAN_SPEED_KM_PER_HOUR / 60;
    const estimatedArrivalMinutes = Math.max(
      1,
      Math.ceil(minDistance / speedKmPerMin),
    );

    return {
      vehicle: closestVehicle,
      distanceKm: minDistance,
      estimatedArrivalMinutes,
    };
  }
}
