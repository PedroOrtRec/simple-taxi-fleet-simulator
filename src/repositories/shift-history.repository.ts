import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {MongodbDataSource} from '../datasources';
import {ShiftHistory, ShiftHistoryRelations} from '../models';

export class ShiftHistoryRepository extends DefaultCrudRepository<
  ShiftHistory,
  typeof ShiftHistory.prototype.id,
  ShiftHistoryRelations
> {
  constructor(@inject('datasources.mongodb') dataSource: MongodbDataSource) {
    super(ShiftHistory, dataSource);
  }
}
