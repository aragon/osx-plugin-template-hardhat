import { ISimpleStorageClientMethods } from "../interfaces";
import {
  prepareGenericInstallation,
  PrepareInstallationStepValue,
  SortDirection,
} from "@aragon/sdk-client-common";
import {
  NumberListItem,
  NumbersQueryParams,
  NumbersSortBy,
  PrepareInstallationParams,
} from "../../types";
import { SimpleStorageClientCore } from "../../core";
import * as BUILD_METADATA from "../../../../contracts/src/build-metadata.json";
import { QueryNumber, QueryNumbers } from "../graphql-queries";
import { SubgraphNumberListItem, SubgraphNumber } from "../types";
import { toNumber, toNumberListItem } from "../utils";

export class SimpleStorageClientMethods extends SimpleStorageClientCore
  implements ISimpleStorageClientMethods {
  // implementation of the methods in the interface
  public async *prepareInstallation(
    params: PrepareInstallationParams,
  ): AsyncGenerator<PrepareInstallationStepValue> {
    // do any additionall custom operations here before you prepare your plugin

    // ...
    
    yield* prepareGenericInstallation(this.web3, {
      daoAddressOrEns: params.daoAddressOrEns,
      pluginRepo: this.simpleStorageRepoAddress,
      version: params.version,
      installationAbi: BUILD_METADATA.pluginSetup.prepareInstallation.inputs,
      installationParams: [params.settings.number],
    });
  }

  public async getNumber(daoAddressOrEns: string): Promise<bigint> {
    const query = QueryNumber;
    const name = "Numbers";
    type T = { dao: SubgraphNumber };
    const { dao } = await this.graphql.request<T>({
      query,
      params: { id: daoAddressOrEns },
      name,
    });
    return toNumber(dao);
  }

  public async getNumbers(
    {
      limit = 10,
      skip = 0,
      direction = SortDirection.ASC,
      sortBy = NumbersSortBy.CREATED_AT,
    }: NumbersQueryParams,
  ): Promise<NumberListItem[]> {
    const query = QueryNumbers;
    const params = {
      limit,
      skip,
      direction,
      sortBy,
    };
    const name = "Numbers";
    type T = { daos: SubgraphNumberListItem[] };
    const { daos } = await this.graphql.request<T>({
      query,
      params,
      name,
    });
    return Promise.all(
      daos.map(async (dao) => {
        return toNumberListItem(dao);
      }),
    );
  }
}
