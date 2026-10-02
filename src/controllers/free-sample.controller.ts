import {get} from '@loopback/rest';

export class FreeSampleController {
  @get('/free-sample')
  freeSample(): string {
    return 'This is a free sample endpoint!';
  }
}
