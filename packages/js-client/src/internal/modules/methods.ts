import { ISimpleStorageClientMethods } from '../interfaces';
import { ClientCore, prepareGenericInstallation } from '@aragon/sdk-client-common';

export class SimpleStorageClientMethods
  extends ClientCore
  implements ISimpleStorageClientMethods
{
  // implementation of the methods in the interface
  public prepareInstallation() {
    SimpleStorage__
    prepareGenericInstallation(this.web3,{

    })
    console.warn('Method not implemented.');
  }
}
