import * as BUILD_METADATA from '../../../../contracts/src/build-metadata.json';
import { MyPlugin__factory } from '../../../../contracts/typechain';
import { MyPluginContext } from '../../context';
import {
  NumberListItem,
  NumbersQueryParams,
  NumbersSortBy,
  PrepareInstallationParams,
} from '../../types';
import { QueryNumber, QueryNumbers } from '../graphql-queries';
import { IMyPluginClientMethods } from '../interfaces';
import {
  StoreNumberStep,
  StoreNumberStepValue,
  SubgraphNumber,
  SubgraphNumberListItem,
} from '../types';
import { toNumber, toNumberListItem } from '../utils';
import {
  ClientCore,
  prepareGenericInstallation,
  PrepareInstallationStepValue,
  SortDirection,
} from '@aragon/sdk-client-common';

export class MyPluginClientMethods
  extends ClientCore
  implements IMyPluginClientMethods
{
  private myPluginRepoAddress: string;
  private myPluginAddress: string;

  constructor(context: MyPluginContext) {
    super(context);

    this.myPluginRepoAddress = context.myPluginRepoAddress;
    this.myPluginAddress = context.myPluginAddress;
  }

  // implementation of the methods in the interface
  public async *prepareInstallation(
    params: PrepareInstallationParams
  ): AsyncGenerator<PrepareInstallationStepValue> {
    // do any additionall custom operations here before you prepare your plugin

    // ...

    yield* prepareGenericInstallation(this.web3, {
      daoAddressOrEns: params.daoAddressOrEns,
      pluginRepo: this.myPluginRepoAddress,
      version: params.version,
      installationAbi: BUILD_METADATA.pluginSetup.prepareInstallation.inputs,
      installationParams: [params.settings.number],
    });
  }

  public async getNumber(daoAddressOrEns: string): Promise<bigint> {
    const query = QueryNumber;
    const name = 'Numbers';
    type T = { dao: SubgraphNumber };
    const { dao } = await this.graphql.request<T>({
      query,
      params: { id: daoAddressOrEns },
      name,
    });
    return toNumber(dao);
  }

  public async getNumbers({
    limit = 10,
    skip = 0,
    direction = SortDirection.ASC,
    sortBy = NumbersSortBy.CREATED_AT,
  }: NumbersQueryParams): Promise<NumberListItem[]> {
    const query = QueryNumbers;
    const params = {
      limit,
      skip,
      direction,
      sortBy,
    };
    const name = 'Numbers';
    type T = { daos: SubgraphNumberListItem[] };
    const { daos } = await this.graphql.request<T>({
      query,
      params,
      name,
    });
    return Promise.all(
      daos.map(async (number) => {
        return toNumberListItem(number);
      })
    );
  }

  // implementation of the methods in the interface
  public async *storeNumber(
    newNumber: bigint
  ): AsyncGenerator<StoreNumberStepValue> {
    const signer = this.web3.getSigner();
    const storageClient = MyPlugin__factory.connect(
      this.myPluginAddress,
      signer
    );

    const tx = await storageClient.storeNumber(newNumber);

    yield {
      status: StoreNumberStep.SETTING,
      txHash: tx.hash,
    };

    await tx.wait();

    yield {
      status: StoreNumberStep.DONE,
    };
  }
}
