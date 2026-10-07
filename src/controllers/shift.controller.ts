import {repository} from '@loopback/repository';
import {
  post,
  param,
  get,
  requestBody,
  response,
  getModelSchemaRef,
  HttpErrors,
} from '@loopback/rest';
import {Shift, ShiftHistory} from '../models';
import {
  ShiftRepository,
  DriverRepository,
  VehicleRepository,
  ShiftHistoryRepository,
} from '../repositories';

export class ShiftController {
  constructor(
    @repository(ShiftRepository)
    public shiftRepository: ShiftRepository,
    @repository(DriverRepository)
    public driverRepository: DriverRepository,
    @repository(VehicleRepository)
    public vehicleRepository: VehicleRepository,
    @repository(ShiftHistoryRepository)
    public shiftHistoryRepository: ShiftHistoryRepository,
  ) {}

  @post('/shifts')
  @response(200, {
    description: 'Create a new real-time Shift in Redis',
    content: {'application/json': {schema: getModelSchemaRef(Shift)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Shift, {
            title: 'NewShift',
            exclude: ['id', 'status', 'acceptedBy', 'date'],
          }),
        },
      },
    })
    shiftData: Omit<Shift, 'id' | 'status' | 'acceptedBy' | 'date'>,
  ): Promise<Shift> {
    const id = Date.now();
    const shift = new Shift({
      ...shiftData,
      id,
      status: 'PENDING',
      date: new Date().toISOString(),
    });

    await this.shiftRepository.set(`shift:${id}`, shift);
    return shift;
  }

  @get('/shifts/{id}')
  @response(200, {
    description: 'Get an active Shift from Redis',
    content: {'application/json': {schema: getModelSchemaRef(Shift)}},
  })
  async findById(@param.path.number('id') id: number): Promise<Shift> {
    const shift = await this.shiftRepository.get(`shift:${id}`);
    if (!shift) {
      throw new HttpErrors.NotFound(`Shift with id ${id} not found.`);
    }
    return shift;
  }

  @post('/shifts/{id}/accept')
  @response(200, {
    description: 'Accept a Shift, marking driver and vehicle as BUSY',
    content: {'application/json': {schema: getModelSchemaRef(Shift)}},
  })
  async accept(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['driverId'],
            properties: {
              driverId: {type: 'number'},
            },
          },
        },
      },
    })
    body: {driverId: number},
  ): Promise<Shift> {
    const shift = await this.shiftRepository.get(`shift:${id}`);
    if (!shift) {
      throw new HttpErrors.NotFound(`Shift with id ${id} not found.`);
    }
    if (shift.status !== 'PENDING') {
      throw new HttpErrors.BadRequest(
        `Shift ${id} is not pending (current status: ${shift.status}).`,
      );
    }

    const driver = await this.driverRepository.findById(body.driverId);
    if (driver.status !== 'AVAILABLE') {
      throw new HttpErrors.BadRequest(
        `Driver ${body.driverId} is not available (status: ${driver.status}).`,
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

  @post('/shifts/{id}/complete')
  @response(200, {
    description:
      'Complete a Shift, archive to MongoDB, free driver/vehicle and remove from Redis',
    content: {'application/json': {schema: getModelSchemaRef(ShiftHistory)}},
  })
  async complete(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              fare: {type: 'number'},
            },
          },
        },
      },
    })
    body?: {fare?: number},
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

    const history = await this.shiftHistoryRepository.create({
      clientName: shift.clientName,
      from: shift.from,
      to: shift.to ?? 'Destination',
      startedAt: shift.date,
      completedAt: new Date().toISOString(),
      driverId: shift.acceptedBy,
      driverName,
      vehiclePlate,
      fare: body?.fare ?? 20.0,
      status: 'FINISHED',
    });

    await this.shiftRepository.delete(`shift:${id}`);
    return history;
  }
}
