import {expect} from '@loopback/testlab';
import {GeocoderDataSource} from '../../../datasources';
import {GeocoderServiceProvider, GeocoderService} from '../../../services';

describe('GeocoderService (Integration - OpenStreetMap Nominatim)', function () {
  // eslint-disable-next-line @typescript-eslint/no-invalid-this
  this.timeout(15000);

  let geocoderDs: GeocoderDataSource;
  let geocoderService: GeocoderService;

  before('initialize GeocoderService', async () => {
    geocoderDs = new GeocoderDataSource();
    const provider = new GeocoderServiceProvider(geocoderDs);
    geocoderService = await provider.value();
  });

  after('disconnect GeocoderDataSource', async () => {
    await geocoderDs.stop();
  });

  it('geocodes an iconic landmark in Jerez de la Frontera', async () => {
    const results = await geocoderService.geocode(
      'Plaza del Arenal, Jerez de la Frontera',
    );

    expect(results).to.be.an.Array();
    expect(results.length).to.be.greaterThanOrEqual(1);

    const first = results[0];
    expect(first.displayName).to.containEql('Jerez de la Frontera');
    expect(first.point.latitude).to.be.within(36.65, 36.72);
    expect(first.point.longitude).to.be.within(-6.18, -6.1);
  });

  it('reverse geocodes coordinates to a street address in Jerez', async () => {
    // Coordinates of Plaza del Arenal, Jerez
    const displayName = await geocoderService.reverseGeocode(
      36.6815245,
      -6.1382897,
    );

    expect(displayName).to.be.a.String();
    expect(displayName).to.containEql('Jerez de la Frontera');
  });

  it('returns empty array when location is not found', async () => {
    const results = await geocoderService.geocode(
      'NonExistentStreetXYZ123456789, Jerez',
    );

    expect(results).to.be.an.Array();
    expect(results.length).to.equal(0);
  });
});
