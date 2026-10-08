import {inject, Provider} from '@loopback/core';
import {getService} from '@loopback/service-proxy';
import {GeocoderDataSource} from '../datasources';
import {GeocoderService, GeocodeResult} from './types';

/* eslint-disable @typescript-eslint/naming-convention */
export interface NominatimRawPlace {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  boundingbox?: string[];
  [key: string]: unknown;
}

export interface NominatimRawReverse {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, unknown>;
  [key: string]: unknown;
}
/* eslint-enable @typescript-eslint/naming-convention */

export interface NominatimRawService {
  geocode(address: string): Promise<NominatimRawPlace[]>;
  reverseGeocode(lat: number, lon: number): Promise<NominatimRawReverse>;
}

export class GeocoderServiceProvider implements Provider<GeocoderService> {
  constructor(
    @inject('datasources.geocoder')
    protected dataSource: GeocoderDataSource = new GeocoderDataSource(),
  ) {}

  async value(): Promise<GeocoderService> {
    const rawService = await getService<NominatimRawService>(this.dataSource);

    return {
      geocode: async (address: string): Promise<GeocodeResult[]> => {
        const rawResults = await rawService.geocode(address);
        if (!Array.isArray(rawResults)) {
          return [];
        }

        return rawResults.map(item => ({
          displayName: item.display_name,
          point: {
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
          },
          boundingBox: item.boundingbox,
        }));
      },

      reverseGeocode: async (
        latitude: number,
        longitude: number,
      ): Promise<string> => {
        const rawResult = await rawService.reverseGeocode(latitude, longitude);
        return rawResult?.display_name ?? '';
      },
    };
  }
}
