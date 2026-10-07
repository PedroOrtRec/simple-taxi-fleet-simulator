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
import {ShiftHistory} from '../models';
import {ShiftHistoryRepository} from '../repositories';

export class ShiftHistoryController {
  constructor(
    @repository(ShiftHistoryRepository)
    public shiftHistoryRepository: ShiftHistoryRepository,
  ) {}

  @post('/shift-histories')
  @response(200, {
    description: 'ShiftHistory model instance',
    content: {'application/json': {schema: getModelSchemaRef(ShiftHistory)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ShiftHistory, {
            title: 'NewShiftHistory',
            exclude: ['id'],
          }),
        },
      },
    })
    shiftHistory: Omit<ShiftHistory, 'id'>,
  ): Promise<ShiftHistory> {
    return this.shiftHistoryRepository.create(shiftHistory);
  }

  @get('/shift-histories/count')
  @response(200, {
    description: 'ShiftHistory model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(ShiftHistory) where?: Where<ShiftHistory>,
  ): Promise<Count> {
    return this.shiftHistoryRepository.count(where);
  }

  @get('/shift-histories')
  @response(200, {
    description: 'Array of ShiftHistory model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(ShiftHistory, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(ShiftHistory) filter?: Filter<ShiftHistory>,
  ): Promise<ShiftHistory[]> {
    return this.shiftHistoryRepository.find(filter);
  }

  @patch('/shift-histories')
  @response(200, {
    description: 'ShiftHistory PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ShiftHistory, {partial: true}),
        },
      },
    })
    shiftHistory: ShiftHistory,
    @param.where(ShiftHistory) where?: Where<ShiftHistory>,
  ): Promise<Count> {
    return this.shiftHistoryRepository.updateAll(shiftHistory, where);
  }

  @get('/shift-histories/{id}')
  @response(200, {
    description: 'ShiftHistory model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(ShiftHistory, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(ShiftHistory, {exclude: 'where'})
    filter?: FilterExcludingWhere<ShiftHistory>,
  ): Promise<ShiftHistory> {
    return this.shiftHistoryRepository.findById(id, filter);
  }

  @patch('/shift-histories/{id}')
  @response(204, {
    description: 'ShiftHistory PATCH success',
  })
  async updateById(
    @param.path.string('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(ShiftHistory, {partial: true}),
        },
      },
    })
    shiftHistory: ShiftHistory,
  ): Promise<void> {
    await this.shiftHistoryRepository.updateById(id, shiftHistory);
  }

  @put('/shift-histories/{id}')
  @response(204, {
    description: 'ShiftHistory PUT success',
  })
  async replaceById(
    @param.path.string('id') id: string,
    @requestBody() shiftHistory: ShiftHistory,
  ): Promise<void> {
    await this.shiftHistoryRepository.replaceById(id, shiftHistory);
  }

  @del('/shift-histories/{id}')
  @response(204, {
    description: 'ShiftHistory DELETE success',
  })
  async deleteById(@param.path.string('id') id: string): Promise<void> {
    await this.shiftHistoryRepository.deleteById(id);
  }
}
