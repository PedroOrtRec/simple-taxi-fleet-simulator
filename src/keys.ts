import {BindingKey} from '@loopback/core';
import type {
  GeocoderService,
  FareCalculatorService,
  ShiftService,
} from './services';

/**
 * Binding keys for GeocoderService (OpenStreetMap Nominatim)
 */
export namespace GeocoderBindings {
  export const GEOCODER_SERVICE = BindingKey.create<GeocoderService>(
    'services.GeocoderService',
  );
}

/**
 * Binding keys for FareCalculatorService (Haversine & Taxi Dispatch)
 */
export namespace FareCalculatorBindings {
  export const FARE_SERVICE = BindingKey.create<FareCalculatorService>(
    'services.FareCalculatorService',
  );
}

/**
 * Binding keys for ShiftService (Domain Orchestrator)
 */
export namespace ShiftServiceBindings {
  export const SHIFT_SERVICE = BindingKey.create<ShiftService>(
    'services.ShiftService',
  );
}
