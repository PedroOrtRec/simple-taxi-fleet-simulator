import {Entity, model, property} from '@loopback/repository';

@model()
export class Vehicle extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  plate: string;

  @property({
    type: 'string',
    required: true,
  })
  licenseNumber: string;

  @property({
    type: 'number',
  })
  assignedDriverId?: number;

  @property({
    type: 'string',
    required: true,
  })
  status: string;

  @property({
    type: 'number',
    postgresql: {
      dataType: 'double precision',
    },
  })
  latitude?: number;

  @property({
    type: 'number',
    postgresql: {
      dataType: 'double precision',
    },
  })
  longitude?: number;

  constructor(data?: Partial<Vehicle>) {
    super(data);
  }
}

export interface VehicleRelations {
  // describe navigational properties here
}

export type VehicleWithRelations = Vehicle & VehicleRelations;
