import { ISimpleStorageClientEncoding } from '../interfaces';
import { ClientCore } from '@aragon/sdk-client-common';

export class SimpleStorageClientEncoding
  extends ClientCore
  implements ISimpleStorageClientEncoding
{
  // implementation of the methods in the interface
  public myAction() {
    console.warn('Method not implemented.');
  }
}
