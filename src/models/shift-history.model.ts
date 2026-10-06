import {Entity, model, property} from '@loopback/repository';

@model()
export class ShiftHistory extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  clientName: string;

  @property({
    type: 'string',
    required: true,
  })
  from: string;

  @property({
    type: 'string',
    required: true,
  })
  to: string;

  @property({
    type: 'date',
  })
  startedAt?: string;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  completedAt?: string;

  @property({
    type: 'number',
  })
  driverId?: number;

  @property({
    type: 'string',
  })
  driverName?: string;

  @property({
    type: 'string',
  })
  vehiclePlate?: string;

  @property({
    type: 'number',
  })
  fare?: number;

  @property({
    type: 'string',
    default: 'FINISHED',
  })
  status?: string;

  constructor(data?: Partial<ShiftHistory>) {
    super(data);
  }
}

export interface ShiftHistoryRelations {
  // describe navigational properties here
}

export type ShiftHistoryWithRelations = ShiftHistory & ShiftHistoryRelations;
