import {Entity, model, property} from '@loopback/repository';

@model()
export class Shift extends Entity {
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
  clientName: string;

  @property({
    type: 'string',
    required: true,
  })
  from: string;

  @property({
    type: 'string',
  })
  to?: string;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  date?: string;

  @property({
    type: 'string',
    default: 'PENDING',
  })
  status?: string;

  @property({
    type: 'number',
  })
  acceptedBy?: number;

  constructor(data?: Partial<Shift>) {
    super(data);
  }
}

export interface ShiftRelations {
  // describe navigational properties here
}

export type ShiftWithRelations = Shift & ShiftRelations;
