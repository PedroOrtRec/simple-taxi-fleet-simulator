import {Client, expect} from '@loopback/testlab';
import {SimpleTaxiFleetSimulatorApplication} from '../..';
import {setupApplication} from './test-helper';

describe('Sample Controllers (Acceptance)', () => {
  let app: SimpleTaxiFleetSimulatorApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({app, client} = await setupApplication());
  });

  after(async () => {
    await app.stop();
  });

  it('invokes GET /hello-world via HTTP', async () => {
    const res = await client.get('/hello-world').expect(200);
    expect(res.text).to.equal('Hello, World!');
  });

  it('invokes GET /free-sample via HTTP', async () => {
    const res = await client.get('/free-sample').expect(200);
    expect(res.text).to.equal('This is a free sample endpoint!');
  });
});
