import { ISimpleStorageClientDecoding } from '../interfaces';
import { ClientCore } from '@aragon/sdk-client-common';

export class SimpleStorageClientDecoding
  extends ClientCore
  implements ISimpleStorageClientDecoding
{
  // implementation of the methods in the interface
  public myAction() {
    console.warn('Method not implemented.');
  }
}
