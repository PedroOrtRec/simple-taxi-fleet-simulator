import {expect} from '@loopback/testlab';
import {DbDataSource} from '../../../datasources';
import {UserRepository} from '../../../repositories';
import {User} from '../../../models';

describe('UserRepository (Integration - In-Memory DB)', () => {
  let dataSource: DbDataSource;
  let userRepo: UserRepository;

  before(async () => {
    dataSource = new DbDataSource();
    userRepo = new UserRepository(dataSource);
  });

  afterEach(async () => {
    await userRepo.deleteAll();
  });

  after(async () => {
    await dataSource.stop();
  });

  it('creates and finds a User', async () => {
    const created = await userRepo.create(
      new User({
        email: 'operator@taxifleet.com',
        name: 'Fleet Operator',
        password: 'secure_password_hash',
      }),
    );

    expect(created.id).to.be.ok();
    expect(created.email).to.equal('operator@taxifleet.com');
    expect(created.role).to.equal('OPERATOR');

    const found = await userRepo.findById(created.id);
    expect(found.name).to.equal('Fleet Operator');
  });
});
