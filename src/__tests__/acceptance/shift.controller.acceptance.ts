import {Client, expect} from '@loopback/testlab';
import {SimpleTaxiFleetSimulatorApplication} from '../..';
import {setupApplication} from './test-helper';
import {
  DriverRepository,
  VehicleRepository,
  ShiftRepository,
  ShiftHistoryRepository,
} from '../../repositories';

describe('ShiftController (Acceptance - E2E Lifecycle)', () => {
  let app: SimpleTaxiFleetSimulatorApplication;
  let client: Client;
  let driverRepo: DriverRepository;
  let vehicleRepo: VehicleRepository;
  let shiftRepo: ShiftRepository;
  let historyRepo: ShiftHistoryRepository;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
    driverRepo = await app.getRepository(DriverRepository);
    vehicleRepo = await app.getRepository(VehicleRepository);
    shiftRepo = await app.getRepository(ShiftRepository);
    historyRepo = await app.getRepository(ShiftHistoryRepository);
  });

  afterEach(async () => {
    await historyRepo.deleteAll();
    await vehicleRepo.deleteAll();
    await driverRepo.deleteAll();
  });

  after(async () => {
    await app.stop();
  });

  it('runs complete shift lifecycle: request -> accept -> complete -> archive', async () => {
    // 1. Setup Driver and assigned Vehicle in PostgreSQL
    const vehicle = await vehicleRepo.create({
      plate: '9988-XYZ',
      licenseNumber: 'TX-MAD-01',
      status: 'AVAILABLE',
      latitude: 404168,
      longitude: -37038,
    });

    const driver = await driverRepo.create({
      name: 'Carlos Sainz',
      status: 'AVAILABLE',
      assignedVehicleId: vehicle.id,
    });

    // 2. Request a shift via POST /shifts (Redis)
    const createRes = await client
      .post('/shifts')
      .send({
        clientName: 'Pedro Ortega',
        from: 'Puerta del Sol',
        to: 'Aeropuerto T4',
      })
      .expect(200);

    const shiftId = createRes.body.id;
    expect(shiftId).to.be.a.Number();
    expect(createRes.body.status).to.equal('PENDING');
    expect(createRes.body.clientName).to.equal('Pedro Ortega');

    // 3. Query the shift via GET /shifts/{id} (Redis)
    const getRes = await client.get(`/shifts/${shiftId}`).expect(200);
    expect(getRes.body.status).to.equal('PENDING');
    expect(getRes.body.from).to.equal('Puerta del Sol');

    // 4. Accept the shift via POST /shifts/{id}/accept
    const acceptRes = await client
      .post(`/shifts/${shiftId}/accept`)
      .send({driverId: driver.id})
      .expect(200);

    expect(acceptRes.body.status).to.equal('ONTHEWAY');
    expect(acceptRes.body.acceptedBy).to.equal(driver.id);

    // Verify driver and vehicle are now BUSY in PostgreSQL
    const updatedDriver = await driverRepo.findById(driver.id);
    expect(updatedDriver.status).to.equal('BUSY');

    const updatedVehicle = await vehicleRepo.findById(vehicle.id);
    expect(updatedVehicle.status).to.equal('BUSY');

    // 5. Complete the shift via POST /shifts/{id}/complete
    const completeRes = await client
      .post(`/shifts/${shiftId}/complete`)
      .send({fare: 35.0})
      .expect(200);

    expect(completeRes.body.clientName).to.equal('Pedro Ortega');
    expect(completeRes.body.from).to.equal('Puerta del Sol');
    expect(completeRes.body.to).to.equal('Aeropuerto T4');
    expect(completeRes.body.driverName).to.equal('Carlos Sainz');
    expect(completeRes.body.vehiclePlate).to.equal('9988-XYZ');
    expect(completeRes.body.fare).to.equal(35.0);
    expect(completeRes.body.status).to.equal('FINISHED');
    expect(completeRes.body.id).to.be.ok();

    // Verify driver and vehicle are released back to AVAILABLE in PostgreSQL
    const freedDriver = await driverRepo.findById(driver.id);
    expect(freedDriver.status).to.equal('AVAILABLE');

    const freedVehicle = await vehicleRepo.findById(vehicle.id);
    expect(freedVehicle.status).to.equal('AVAILABLE');

    // Verify shift was removed from Redis
    await client.get(`/shifts/${shiftId}`).expect(404);

    // Verify document exists in MongoDB history
    const historyList = await historyRepo.find({
      where: {driverName: 'Carlos Sainz'},
    });
    expect(historyList).to.have.length(1);
    expect(historyList[0].fare).to.equal(35.0);
  });

  it('rejects accepting a shift if driver is not AVAILABLE', async () => {
    const driver = await driverRepo.create({
      name: 'Busy Driver',
      status: 'BUSY',
    });

    const createRes = await client
      .post('/shifts')
      .send({clientName: 'Client', from: 'A', to: 'B'})
      .expect(200);

    const shiftId = createRes.body.id;

    const res = await client
      .post(`/shifts/${shiftId}/accept`)
      .send({driverId: driver.id})
      .expect(400);

    expect(res.body.error.message).to.containEql('not available');

    // Clean up Redis key
    await shiftRepo.delete(`shift:${shiftId}`);
  });

  it('rejects completing a shift if it is still PENDING', async () => {
    const createRes = await client
      .post('/shifts')
      .send({clientName: 'Client', from: 'A', to: 'B'})
      .expect(200);

    const shiftId = createRes.body.id;

    const res = await client
      .post(`/shifts/${shiftId}/complete`)
      .send({fare: 20})
      .expect(400);

    expect(res.body.error.message).to.containEql('cannot be completed');

    // Clean up Redis key
    await shiftRepo.delete(`shift:${shiftId}`);
  });

  it('returns 404 for non-existent shift in Redis', async () => {
    await client.get('/shifts/999999999').expect(404);
  });
});
