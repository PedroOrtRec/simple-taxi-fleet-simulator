import {inject} from '@loopback/core';
import {DefaultKeyValueRepository} from '@loopback/repository';
import {RedisDataSource} from '../datasources';
import {Shift} from '../models';

export class ShiftRepository extends DefaultKeyValueRepository<Shift> {
  constructor(@inject('datasources.redis') dataSource: RedisDataSource) {
    super(Shift, dataSource);
  }
}
