// Uncomment these imports to begin using these cool features!

// import {inject} from '@loopback/core';
import {get} from '@loopback/rest';

export class HelloWorldController {
  constructor() {}

  @get('/hello-world')
  helloWorld(): string {
    return 'Hello, World!';
  }
}
