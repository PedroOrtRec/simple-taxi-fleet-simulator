import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {Vehicle} from '../models';
import {VehicleRepository} from '../repositories';

export class VehicleController {
  constructor(
    @repository(VehicleRepository)
    public vehicleRepository: VehicleRepository,
  ) {}

  @post('/vehicles')
  @response(200, {
    description: 'Vehicle model instance',
    content: {'application/json': {schema: getModelSchemaRef(Vehicle)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Vehicle, {
            title: 'NewVehicle',
            exclude: ['id'],
          }),
        },
      },
    })
    vehicle: Omit<Vehicle, 'id'>,
  ): Promise<Vehicle> {
    return this.vehicleRepository.create(vehicle);
  }

  @get('/vehicles/count')
  @response(200, {
    description: 'Vehicle model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Vehicle) where?: Where<Vehicle>): Promise<Count> {
    return this.vehicleRepository.count(where);
  }

  @get('/vehicles')
  @response(200, {
    description: 'Array of Vehicle model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Vehicle, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Vehicle) filter?: Filter<Vehicle>,
  ): Promise<Vehicle[]> {
    return this.vehicleRepository.find(filter);
  }

  @patch('/vehicles')
  @response(200, {
    description: 'Vehicle PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Vehicle, {partial: true}),
        },
      },
    })
    vehicle: Vehicle,
    @param.where(Vehicle) where?: Where<Vehicle>,
  ): Promise<Count> {
    return this.vehicleRepository.updateAll(vehicle, where);
  }

  @get('/vehicles/{id}')
  @response(200, {
    description: 'Vehicle model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Vehicle, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Vehicle, {exclude: 'where'})
    filter?: FilterExcludingWhere<Vehicle>,
  ): Promise<Vehicle> {
    return this.vehicleRepository.findById(id, filter);
  }

  @patch('/vehicles/{id}')
  @response(204, {
    description: 'Vehicle PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Vehicle, {partial: true}),
        },
      },
    })
    vehicle: Vehicle,
  ): Promise<void> {
    await this.vehicleRepository.updateById(id, vehicle);
  }

  @put('/vehicles/{id}')
  @response(204, {
    description: 'Vehicle PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() vehicle: Vehicle,
  ): Promise<void> {
    await this.vehicleRepository.replaceById(id, vehicle);
  }

  @del('/vehicles/{id}')
  @response(204, {
    description: 'Vehicle DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.vehicleRepository.deleteById(id);
  }
}
