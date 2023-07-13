import { ISimpleStorageClientMethods } from "../interfaces";
import {
  prepareGenericInstallation,
  PrepareInstallationStepValue,
} from "@aragon/sdk-client-common";
import { SimpleStorage__factory } from "@aragon/todo-plugin-ethers";
import {
  PrepareInstallationParams,
  StoreNumberStep,
  StoreNumberStepValue,
} from "../../types";
import { SimpleStorageClientCore } from "../../core";
import * as BUILD_METADATA from "../../../../contracts/src/build-metadata.json";
import { PluginRepo__factory } from "@aragon/osx-ethers";

export class SimpleStorageClientMethods extends SimpleStorageClientCore
  implements ISimpleStorageClientMethods {
  // implementation of the methods in the interface
  public async *prepareInstallation(
    params: PrepareInstallationParams,
  ): AsyncGenerator<PrepareInstallationStepValue> {
    let version = params.version;
    // if not specified use the lates version
    if (!version) {
      // get signer
      const signer = this.web3.getConnectedSigner();
      // connect to the plugin repo
      const pluginRepo = PluginRepo__factory.connect(
        this.simpleStorageRepoAddress,
        signer,
      );
      // get latest release
      const currentRelease = await pluginRepo.latestRelease();
      // get latest version
      const latestVersion = await pluginRepo["getLatestVersion(uint8)"](
        currentRelease,
      );
      version = latestVersion.tag;
    }

    yield* prepareGenericInstallation(this.web3, {
      daoAddressOrEns: params.daoAddressOrEns,
      pluginRepo: this.simpleStorageRepoAddress,
      version,
      installationAbi: BUILD_METADATA.pluginSetup.prepareInstallation.inputs,
      installationParams: [params.settings.number],
    });
  }

  public async *storeNumber(
    number: bigint,
  ): AsyncGenerator<StoreNumberStepValue> {
    // get signer
    const signer = this.web3.getConnectedSigner();
    // connect to the contract
    const simpleStorage = SimpleStorage__factory.connect(
      this.simpleStoragePluginAddress,
      signer,
    );
    const tx = await simpleStorage.storeNumber(number);
    yield {
      key: StoreNumberStep.STORING,
      txHash: tx.hash,
    };
    await tx.wait();
    yield {
      key: StoreNumberStep.DONE,
      txHash: tx.hash,
    };
  }
}
