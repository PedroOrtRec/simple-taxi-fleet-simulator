import {expect} from '@loopback/testlab';
import {MongodbDataSource} from '../../../datasources';
import {ShiftHistoryRepository} from '../../../repositories';
import {ShiftHistory} from '../../../models';

describe('ShiftHistoryRepository (Integration - MongoDB)', () => {
  let dataSource: MongodbDataSource;
  let historyRepo: ShiftHistoryRepository;

  before(async () => {
    dataSource = new MongodbDataSource();
    historyRepo = new ShiftHistoryRepository(dataSource);
  });

  afterEach(async () => {
    await historyRepo.deleteAll();
  });

  after(async () => {
    await dataSource.stop();
  });

  it('creates and queries archived shifts in MongoDB', async () => {
    const created = await historyRepo.create(
      new ShiftHistory({
        clientName: 'David Gil',
        from: 'Gran Vía 32',
        to: 'Plaza Mayor',
        driverName: 'Carlos Sainz',
        vehiclePlate: '5678-ABC',
        fare: 15.2,
        completedAt: new Date().toISOString(),
      }),
    );

    expect(created.id).to.be.ok();
    expect(String(created.id)).to.be.a.String();
    expect(created.fare).to.equal(15.2);

    const list = await historyRepo.find({where: {driverName: 'Carlos Sainz'}});
    expect(list).to.have.length(1);
    expect(list[0].clientName).to.equal('David Gil');
  });
});
