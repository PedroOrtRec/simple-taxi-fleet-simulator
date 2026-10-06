import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {Driver, DriverRelations} from '../models';

export class DriverRepository extends DefaultCrudRepository<
  Driver,
  typeof Driver.prototype.id,
  DriverRelations
> {
  constructor(@inject('datasources.postgres') dataSource: PostgresDataSource) {
    super(Driver, dataSource);
  }
}
