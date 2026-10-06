import {expect} from '@loopback/testlab';
import {RedisDataSource} from '../../../datasources';
import {ShiftRepository} from '../../../repositories';
import {Shift} from '../../../models';

describe('ShiftRepository (Integration - Redis KeyValue)', () => {
  let dataSource: RedisDataSource;
  let shiftRepo: ShiftRepository;
  const testKey = 'shift:test:user1';

  before(async () => {
    dataSource = new RedisDataSource();
    shiftRepo = new ShiftRepository(dataSource);
  });

  afterEach(async () => {
    await shiftRepo.delete(testKey);
  });

  after(async () => {
    await dataSource.stop();
  });

  it('stores and retrieves a real-time shift in Redis', async () => {
    const shift = new Shift({
      clientName: 'Elena Naranjo',
      from: 'Paseo de la Castellana 100',
      to: 'Estación de Atocha',
      status: 'ONTHEWAY',
    });

    await shiftRepo.set(testKey, shift);

    const retrieved = await shiftRepo.get(testKey);
    expect(retrieved).to.be.ok();
    expect(retrieved.clientName).to.equal('Elena Naranjo');
    expect(retrieved.from).to.equal('Paseo de la Castellana 100');
    expect(retrieved.to).to.equal('Estación de Atocha');
    expect(retrieved.status).to.equal('ONTHEWAY');
  });

  it('deletes a shift key from Redis', async () => {
    await shiftRepo.set(testKey, new Shift({clientName: 'Test', from: 'A'}));
    await shiftRepo.delete(testKey);

    const retrieved = await shiftRepo.get(testKey);
    expect(retrieved).to.be.null();
  });
});
