import {expect} from '@loopback/testlab';
import {
  DbDataSource,
  PostgresDataSource,
  RedisDataSource,
  MongodbDataSource,
  GeocoderDataSource,
} from '../../../datasources';

describe('DataSources Integration Tests', () => {
  let dbDs: DbDataSource;
  let pgDs: PostgresDataSource;
  let redisDs: RedisDataSource;
  let mongoDs: MongodbDataSource;
  let geocoderDs: GeocoderDataSource;

  before('DataSources Initialization', async () => {
    dbDs = new DbDataSource();
    pgDs = new PostgresDataSource();
    redisDs = new RedisDataSource();
    mongoDs = new MongodbDataSource();
    geocoderDs = new GeocoderDataSource();
  });

  after('DataSources Disconnection', async () => {
    await dbDs.stop();
    await pgDs.stop();
    await redisDs.stop();
    await mongoDs.stop();
    await geocoderDs.stop();
  });

  it('should connect to in-memory DbDataSource', async () => {
    await dbDs.connect();
    expect(dbDs.connected).to.be.true();
  });

  it('should connect to PostgresDataSource in Docker', async () => {
    await pgDs.ping();
  });

  it('should connect to RedisDataSource in Docker', async () => {
    await redisDs.ping();
  });

  it('should connect to MongodbDataSource in Docker', async () => {
    await mongoDs.ping();
  });

  it('should initialize GeocoderDataSource with rest connector', async () => {
    expect(geocoderDs.name).to.equal('geocoder');
    expect(geocoderDs.settings.connector).to.equal('rest');
  });
});
