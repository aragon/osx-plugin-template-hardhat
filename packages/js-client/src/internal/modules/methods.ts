import { ISimpleStorageClientMethods } from '../interfaces';
import { ClientCore } from '@aragon/sdk-client-common';

export class SimpleStorageClientMethods
  extends ClientCore
  implements ISimpleStorageClientMethods
{
  // implementation of the methods in the interface
  public myMethod() {
    console.warn('Method not implemented.');
  }
}
