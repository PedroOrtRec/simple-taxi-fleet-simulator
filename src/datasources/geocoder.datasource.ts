import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'geocoder',
  connector: 'rest',
  options: {
    headers: {
      accept: 'application/json',
      'User-Agent': 'SimpleTaxiFleetSimulator/1.0',
    },
  },
  operations: [
    {
      template: {
        method: 'GET',
        url: 'https://nominatim.openstreetmap.org/search',
        headers: {
          'User-Agent': 'SimpleTaxiFleetSimulator/1.0',
          accept: 'application/json',
        },
        query: {
          q: '{address}',
          format: 'json',
          limit: 1,
          countrycodes: 'es',
        },
      },
      functions: {
        geocode: ['address'],
      },
    },
    {
      template: {
        method: 'GET',
        url: 'https://nominatim.openstreetmap.org/reverse',
        headers: {
          'User-Agent': 'SimpleTaxiFleetSimulator/1.0',
          accept: 'application/json',
        },
        query: {
          lat: '{lat}',
          lon: '{lon}',
          format: 'json',
        },
      },
      functions: {
        reverseGeocode: ['lat', 'lon'],
      },
    },
  ],
};

@lifeCycleObserver('datasource')
export class GeocoderDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'geocoder';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.geocoder', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
