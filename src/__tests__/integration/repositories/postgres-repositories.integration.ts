import {expect} from '@loopback/testlab';
import {PostgresDataSource} from '../../../datasources';
import {DriverRepository, VehicleRepository} from '../../../repositories';
import {Driver, Vehicle} from '../../../models';

describe('PostgreSQL Repositories (Integration)', () => {
  let dataSource: PostgresDataSource;
  let driverRepo: DriverRepository;
  let vehicleRepo: VehicleRepository;

  before(async () => {
    dataSource = new PostgresDataSource();
    driverRepo = new DriverRepository(dataSource);
    vehicleRepo = new VehicleRepository(dataSource);
  });

  afterEach(async () => {
    await vehicleRepo.deleteAll();
    await driverRepo.deleteAll();
  });

  after(async () => {
    await dataSource.stop();
  });

  it('creates and finds a Driver', async () => {
    const created = await driverRepo.create(new Driver({name: 'Carlos Sainz'}));
    expect(created.id).to.be.a.Number();
    expect(created.name).to.equal('Carlos Sainz');
    expect(created.status).to.equal('AVAILABLE');

    const found = await driverRepo.findById(created.id);
    expect(found.name).to.equal('Carlos Sainz');
  });

  it('creates, updates and deletes a Vehicle', async () => {
    const vehicle = await vehicleRepo.create(
      new Vehicle({
        plate: '5678-ABC',
        licenseNumber: 'TX-100',
        status: 'AVAILABLE',
        latitude: 404168,
        longitude: -37038,
      }),
    );
    expect(vehicle.id).to.be.a.Number();

    await vehicleRepo.updateById(vehicle.id, {status: 'BUSY'});
    const updated = await vehicleRepo.findById(vehicle.id);
    expect(updated.status).to.equal('BUSY');

    await vehicleRepo.deleteById(vehicle.id);
    const count = await vehicleRepo.count({id: vehicle.id});
    expect(count.count).to.equal(0);
  });
});
