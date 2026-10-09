import {expect} from '@loopback/testlab';
import {
  DriverRepository,
  VehicleRepository,
  UserRepository,
} from '../../../repositories';
import {PostgresDataSource, DbDataSource} from '../../../datasources';
import {DatabaseSeedObserver, JEREZ_TAXI_FLEET_SEED} from '../../../observers';

describe('DatabaseSeedObserver (Integration)', () => {
  let postgresDs: PostgresDataSource;
  let dbDs: DbDataSource;
  let vehicleRepo: VehicleRepository;
  let driverRepo: DriverRepository;
  let userRepo: UserRepository;
  let observer: DatabaseSeedObserver;

  before('setup repositories and observer', async () => {
    postgresDs = new PostgresDataSource();
    dbDs = new DbDataSource();

    vehicleRepo = new VehicleRepository(postgresDs);
    driverRepo = new DriverRepository(postgresDs);
    userRepo = new UserRepository(dbDs);

    observer = new DatabaseSeedObserver(vehicleRepo, driverRepo, userRepo);
  });

  after('cleanup and disconnect', async () => {
    await driverRepo.deleteAll();
    await vehicleRepo.deleteAll();
    await userRepo.deleteAll();
    await postgresDs.stop();
    await dbDs.stop();
  });

  it('seeds initial Jerez fleet and operator when empty', async () => {
    await driverRepo.deleteAll();
    await vehicleRepo.deleteAll();
    await userRepo.deleteAll();

    await observer.start();

    const vehicleCount = await vehicleRepo.count();
    expect(vehicleCount.count).to.equal(JEREZ_TAXI_FLEET_SEED.length);

    const driverCount = await driverRepo.count();
    expect(driverCount.count).to.equal(JEREZ_TAXI_FLEET_SEED.length);

    const userCount = await userRepo.count();
    expect(userCount.count).to.be.greaterThanOrEqual(1);

    const arenalTaxi = await vehicleRepo.findOne({
      where: {plate: '1001-JRX'},
    });
    expect(arenalTaxi).to.not.be.null();
    expect(arenalTaxi?.latitude).to.equal(36.6815);
    expect(arenalTaxi?.longitude).to.equal(-6.1383);
  });

  it('is idempotent on subsequent starts', async () => {
    await observer.start();

    const vehicleCount = await vehicleRepo.count();
    expect(vehicleCount.count).to.equal(JEREZ_TAXI_FLEET_SEED.length);

    const driverCount = await driverRepo.count();
    expect(driverCount.count).to.equal(JEREZ_TAXI_FLEET_SEED.length);
  });

  it('executes stop() and logs fleet summary cleanly', async () => {
    await observer.stop();
  });
});
