import { SimpleStorageClient, SimpleStorageContext } from '../../src';
import * as ganacheSetup from '../helpers/ganache-setup';
import { Server } from 'ganache';

describe('Encoding', () => {
  let server: Server;
  beforeAll(async () => {
    server = await ganacheSetup.start();
    // deploy contracts and do other setup if necessary
  });

  afterAll(async () => {
    server.close();
  });

  it('should encode an action', async () => {
    const ctx = new SimpleStorageContext();
    const client = new SimpleStorageClient(ctx);
    client.encoding.myAction();
  });
});
