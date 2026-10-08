import {expect} from '@loopback/testlab';
import {Vehicle} from '../../../models';
import {
  FareCalculatorService,
  FARE_CONSTANTS,
} from '../../../services/fare-calculator.service';

describe('FareCalculatorService (Unit)', () => {
  let service: FareCalculatorService;

  beforeEach(() => {
    service = new FareCalculatorService();
  });

  describe('calculateDistance (Haversine)', () => {
    it('returns 0 when origin and destination are identical', () => {
      const point = {latitude: 36.6815, longitude: -6.1383};
      const distance = service.calculateDistance(point, point);
      expect(distance).to.equal(0);
    });

    it('calculates accurate distance between Plaza del Arenal and Estación de Tren in Jerez', () => {
      const arenal = {latitude: 36.6815, longitude: -6.1383};
      const estacion = {latitude: 36.6868, longitude: -6.1264};

      const distance = service.calculateDistance(arenal, estacion);
      // Real great-circle distance is ~1.22 km
      expect(distance).to.be.within(1.1, 1.35);
    });

    it('calculates accurate distance from Jerez center to Jerez Airport', () => {
      const arenal = {latitude: 36.6815, longitude: -6.1383};
      const aeropuerto = {latitude: 36.7446, longitude: -6.0601};

      const distance = service.calculateDistance(arenal, aeropuerto);
      // Real great-circle distance is ~9.6 km
      expect(distance).to.be.within(9.0, 10.5);
    });
  });

  describe('estimateFare', () => {
    it('enforces minimum fare for short trips under 1.25 km', () => {
      const fareZeroKm = service.estimateFare(0);
      expect(fareZeroKm).to.equal(FARE_CONSTANTS.MIN_FARE);

      const fareOneKm = service.estimateFare(1.0);
      // 2.50 + 1.20 = 3.70 < 4.00 MIN_FARE
      expect(fareOneKm).to.equal(4.0);
    });

    it('calculates proportional fare for medium trips', () => {
      // 3.0 km -> 2.50 + (3.0 * 1.20) = 6.10
      const fare = service.estimateFare(3.0);
      expect(fare).to.equal(6.1);
    });

    it('calculates proportional fare for long trips to airport', () => {
      // 9.6 km -> 2.50 + (9.6 * 1.20) = 2.50 + 11.52 = 14.02
      const fare = service.estimateFare(9.6);
      expect(fare).to.equal(14.02);
    });
  });

  describe('findClosestVehicle', () => {
    it('returns null when vehicle list is empty', () => {
      const pickup = {latitude: 36.6815, longitude: -6.1383};
      const result = service.findClosestVehicle(pickup, []);
      expect(result).to.be.null();
    });

    it('returns null when all vehicles have undefined coordinates', () => {
      const pickup = {latitude: 36.6815, longitude: -6.1383};
      const vehicle = new Vehicle({
        id: 1,
        plate: '1234-BBB',
        licenseNumber: 'TX-01',
      });
      const result = service.findClosestVehicle(pickup, [vehicle]);
      expect(result).to.be.null();
    });

    it('selects the closest vehicle among candidates in Jerez', () => {
      const pickup = {latitude: 36.683, longitude: -6.138}; // Calle Larga

      const vFarAirport = new Vehicle({
        id: 1,
        plate: '1111-AAA',
        licenseNumber: 'TX-01',
        latitude: 36.7446,
        longitude: -6.0601,
      });

      const vMediumHospital = new Vehicle({
        id: 2,
        plate: '2222-BBB',
        licenseNumber: 'TX-02',
        latitude: 36.6974,
        longitude: -6.1558,
      });

      const vClosestArenal = new Vehicle({
        id: 3,
        plate: '3333-CCC',
        licenseNumber: 'TX-03',
        latitude: 36.6815,
        longitude: -6.1383,
      });

      const result = service.findClosestVehicle(pickup, [
        vFarAirport,
        vMediumHospital,
        vClosestArenal,
      ]);

      expect(result).to.not.be.null();
      expect(result?.vehicle.id).to.equal(3);
      expect(result?.distanceKm).to.be.within(0.1, 0.3);
      expect(result?.estimatedArrivalMinutes).to.be.greaterThanOrEqual(1);
    });
  });
});
