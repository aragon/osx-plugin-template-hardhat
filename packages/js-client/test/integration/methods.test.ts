import { SimpleStorageClient, SimpleStorageContext } from '../../src';
import * as ganacheSetup from '../helpers/ganache-setup';
import { Server } from 'ganache';

describe('Methods', () => {
  let server: Server;
  beforeAll(async () => {
    server = await ganacheSetup.start();
    // deploy contracts and do other setup if necessary
  });

  afterAll(async () => {
    server.close();
  });

  it('should test a method', async () => {
    const ctx = new SimpleStorageContext();
    const client = new SimpleStorageClient(ctx);
    client.methods.myMethod();
  });
});
