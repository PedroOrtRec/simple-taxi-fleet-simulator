import {inject} from '@loopback/core';
import {
  post,
  param,
  get,
  requestBody,
  response,
  getModelSchemaRef,
} from '@loopback/rest';
import {Shift, ShiftHistory, Vehicle} from '../models';
import {ShiftServiceBindings} from '../keys';
import {ShiftService, ClosestVehicleResult} from '../services';

export class ShiftController {
  constructor(
    @inject(ShiftServiceBindings.SHIFT_SERVICE)
    public shiftService: ShiftService,
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
    return this.shiftService.request(shiftData);
  }

  @get('/shifts/{id}')
  @response(200, {
    description: 'Get an active Shift from Redis',
    content: {'application/json': {schema: getModelSchemaRef(Shift)}},
  })
  async findById(@param.path.number('id') id: number): Promise<Shift> {
    return this.shiftService.getById(id);
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
    return this.shiftService.accept(id, body.driverId);
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
              to: {type: 'string'},
            },
          },
        },
      },
    })
    body?: {fare?: number; to?: string},
  ): Promise<ShiftHistory> {
    return this.shiftService.complete(id, body);
  }

  @get('/shifts/closest-taxi')
  @response(200, {
    description: 'Find closest available taxi in Jerez for a pickup location',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            vehicle: getModelSchemaRef(Vehicle),
            distanceKm: {type: 'number'},
            estimatedArrivalMinutes: {type: 'number'},
          },
        },
      },
    },
  })
  async findClosestTaxi(
    @param.query.string('address', {required: true}) address: string,
  ): Promise<ClosestVehicleResult | null> {
    return this.shiftService.suggestClosestVehicle(address);
  }
}
