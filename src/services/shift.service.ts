import {bind, BindingScope, inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {Shift, ShiftHistory} from '../models';
import {
  ShiftRepository,
  DriverRepository,
  VehicleRepository,
  ShiftHistoryRepository,
} from '../repositories';
import {GeocoderBindings, FareCalculatorBindings} from '../keys';
import {
  CreateShiftRequest,
  CompleteShiftPayload,
  GeocoderService,
  ClosestVehicleResult,
} from './types';
import {FareCalculatorService} from './fare-calculator.service';

@bind({scope: BindingScope.SINGLETON})
export class ShiftService {
  constructor(
    @repository(ShiftRepository)
    public shiftRepository: ShiftRepository,
    @repository(DriverRepository)
    public driverRepository: DriverRepository,
    @repository(VehicleRepository)
    public vehicleRepository: VehicleRepository,
    @repository(ShiftHistoryRepository)
    public shiftHistoryRepository: ShiftHistoryRepository,
    @inject(GeocoderBindings.GEOCODER_SERVICE)
    public geocoderService: GeocoderService,
    @inject(FareCalculatorBindings.FARE_SERVICE)
    public fareCalculatorService: FareCalculatorService,
  ) {}

  /**
   * Creates a new Shift in Redis with PENDING status.
   */
  async request(data: CreateShiftRequest): Promise<Shift> {
    const id = Date.now();
    const shift = new Shift({
      ...data,
      id,
      status: 'PENDING',
      date: new Date().toISOString(),
    });

    await this.shiftRepository.set(`shift:${id}`, shift);
    return shift;
  }

  /**
   * Retrieves an active Shift from Redis.
   */
  async getById(id: number): Promise<Shift> {
    const shift = await this.shiftRepository.get(`shift:${id}`);
    if (!shift) {
      throw new HttpErrors.NotFound(`Shift with id ${id} not found.`);
    }
    return shift;
  }

  /**
   * Accepts a Shift by associating an available driver and marking both driver
   * and vehicle as BUSY in PostgreSQL, and updating Redis status to ONTHEWAY.
   */
  async accept(id: number, driverId: number): Promise<Shift> {
    const shift = await this.shiftRepository.get(`shift:${id}`);
    if (!shift) {
      throw new HttpErrors.NotFound(`Shift with id ${id} not found.`);
    }
    if (shift.status !== 'PENDING') {
      throw new HttpErrors.BadRequest(
        `Shift ${id} is not pending (current status: ${shift.status}).`,
      );
    }

    const driver = await this.driverRepository.findById(driverId);
    if (driver.status !== 'AVAILABLE') {
      throw new HttpErrors.BadRequest(
        `Driver ${driverId} is not available (status: ${driver.status}).`,
      );
    }

    await this.driverRepository.updateById(driver.id, {status: 'BUSY'});
    if (driver.assignedVehicleId) {
      await this.vehicleRepository.updateById(driver.assignedVehicleId, {
        status: 'BUSY',
      });
    }

    shift.status = 'ONTHEWAY';
    shift.acceptedBy = driver.id;
    await this.shiftRepository.set(`shift:${id}`, shift);
    return shift;
  }

  /**
   * Completes a Shift, frees driver and vehicle back to AVAILABLE in PostgreSQL,
   * calculates estimated fare if not explicitly passed, persists immutable
   * snapshot to MongoDB ShiftHistory, and removes the shift from Redis.
   */
  async complete(
    id: number,
    payload?: CompleteShiftPayload,
  ): Promise<ShiftHistory> {
    const shift = await this.shiftRepository.get(`shift:${id}`);
    if (!shift) {
      throw new HttpErrors.NotFound(`Shift with id ${id} not found.`);
    }
    if (shift.status !== 'ONTHEWAY') {
      throw new HttpErrors.BadRequest(
        `Shift ${id} cannot be completed (current status: ${shift.status}).`,
      );
    }

    let driverName = 'Unknown';
    let vehiclePlate: string | undefined;

    if (shift.acceptedBy) {
      const driver = await this.driverRepository.findById(shift.acceptedBy);
      driverName = driver.name;
      await this.driverRepository.updateById(driver.id, {status: 'AVAILABLE'});

      if (driver.assignedVehicleId) {
        const vehicle = await this.vehicleRepository.findById(
          driver.assignedVehicleId,
        );
        vehiclePlate = vehicle.plate;
        await this.vehicleRepository.updateById(vehicle.id, {
          status: 'AVAILABLE',
        });
      }
    }

    const destination = payload?.to ?? shift.to ?? 'Destination';
    let finalFare = payload?.fare;

    // If no fare was provided, estimate using geocoding and Haversine
    if (finalFare === undefined && shift.from && destination) {
      try {
        const [originResults, destResults] = await Promise.all([
          this.geocoderService.geocode(shift.from),
          this.geocoderService.geocode(destination),
        ]);
        if (originResults.length > 0 && destResults.length > 0) {
          const distance = this.fareCalculatorService.calculateDistance(
            originResults[0].point,
            destResults[0].point,
          );
          finalFare = this.fareCalculatorService.estimateFare(distance);
        }
      } catch {
        // Fallback default fare if geocoding service is unavailable
      }
    }

    if (finalFare === undefined) {
      finalFare = 20.0;
    }

    const history = await this.shiftHistoryRepository.create({
      clientName: shift.clientName,
      from: shift.from,
      to: destination,
      startedAt: shift.date,
      completedAt: new Date().toISOString(),
      driverId: shift.acceptedBy,
      driverName,
      vehiclePlate,
      fare: finalFare,
      status: 'FINISHED',
    });

    await this.shiftRepository.delete(`shift:${id}`);
    return history;
  }

  /**
   * Suggests the closest available vehicle in Jerez given a pickup address.
   */
  async suggestClosestVehicle(
    pickupAddress: string,
  ): Promise<ClosestVehicleResult | null> {
    const geocodeResults = await this.geocoderService.geocode(pickupAddress);
    if (geocodeResults.length === 0) {
      return null;
    }

    const pickupPoint = geocodeResults[0].point;
    const availableVehicles = await this.vehicleRepository.find({
      where: {status: 'AVAILABLE'},
    });

    return this.fareCalculatorService.findClosestVehicle(
      pickupPoint,
      availableVehicles,
    );
  }
}
