import {Client, expect} from '@loopback/testlab';
import {SimpleTaxiFleetSimulatorApplication} from '../..';
import {setupApplication} from './test-helper';
import {DriverRepository} from '../../repositories';

describe('DriverController (Acceptance)', () => {
  let app: SimpleTaxiFleetSimulatorApplication;
  let client: Client;
  let driverRepo: DriverRepository;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
    driverRepo = await app.getRepository(DriverRepository);
  });

  beforeEach(async () => {
    await driverRepo.deleteAll();
  });

  after(async () => {
    await driverRepo.deleteAll();
    await app.stop();
  });

  it('creates a driver via POST /drivers', async () => {
    const res = await client
      .post('/drivers')
      .send({name: 'Fernando Alonso', status: 'AVAILABLE'})
      .expect(200);

    expect(res.body.id).to.be.a.Number();
    expect(res.body.name).to.equal('Fernando Alonso');
    expect(res.body.status).to.equal('AVAILABLE');
  });

  it('gets list of drivers via GET /drivers', async () => {
    await driverRepo.create({name: 'Driver 1', status: 'AVAILABLE'});
    await driverRepo.create({name: 'Driver 2', status: 'AVAILABLE'});

    const res = await client.get('/drivers').expect(200);
    expect(res.body).to.be.an.Array();
    expect(res.body).to.have.length(2);
  });

  it('retrieves a driver by id via GET /drivers/{id}', async () => {
    const created = await driverRepo.create({name: 'Driver Detail'});

    const res = await client.get(`/drivers/${created.id}`).expect(200);
    expect(res.body.name).to.equal('Driver Detail');
  });

  it('updates a driver via PATCH /drivers/{id}', async () => {
    const created = await driverRepo.create({
      name: 'Driver Update',
      status: 'AVAILABLE',
    });

    await client
      .patch(`/drivers/${created.id}`)
      .send({status: 'BUSY'})
      .expect(204);

    const updated = await driverRepo.findById(created.id);
    expect(updated.status).to.equal('BUSY');
  });

  it('deletes a driver via DELETE /drivers/{id}', async () => {
    const created = await driverRepo.create({name: 'Driver Delete'});

    await client.del(`/drivers/${created.id}`).expect(204);

    const count = await driverRepo.count({id: created.id});
    expect(count.count).to.equal(0);
  });
});
