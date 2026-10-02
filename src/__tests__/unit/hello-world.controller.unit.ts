import {expect} from '@loopback/testlab';
import {HelloWorldController} from '../../controllers/hello-world.controller';
import {FreeSampleController} from '../../controllers/free-sample.controller';

describe('Controller Unit Tests', () => {
  it('invokes HelloWorldController.helloWorld() and returns the expected greeting', () => {
    const controller = new HelloWorldController();
    const result = controller.helloWorld();
    expect(result).to.equal('Hello, World!');
  });

  it('invokes FreeSampleController.freeSample() and returns the expected message', () => {
    const controller = new FreeSampleController();
    const result = controller.freeSample();
    expect(result).to.equal('This is a free sample endpoint!');
  });
});
