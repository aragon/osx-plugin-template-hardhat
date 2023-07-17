import { PluginRepo__factory } from "@aragon/osx-ethers";
import { SimpleStorageClientCore } from "../../core";
import { PrepareInstallationParams } from "../../types";
import { ISimpleStorageClientEstimation } from "../interfaces";
import {
  GasFeeEstimation,
  prepareGenericInstallationEstimation,
} from "@aragon/sdk-client-common";
import * as BUILD_METADATA from "../../../../contracts/src/build-metadata.json";
import { SimpleStorage__factory } from "@aragon/simple-storage-ethers";

export class SimpleStoragClientEstimation extends SimpleStorageClientCore
  implements ISimpleStorageClientEstimation {
  public async prepareInstallation(
    params: PrepareInstallationParams,
  ): Promise<GasFeeEstimation> {
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

    return prepareGenericInstallationEstimation(this.web3, {
      daoAddressOrEns: params.daoAddressOrEns,
      pluginRepo: this.simpleStorageRepoAddress,
      version,
      installationAbi: BUILD_METADATA.pluginSetup.prepareInstallation.inputs,
      installationParams: [params.settings.number],
    });
  }

  public async storeNumber(number: bigint): Promise<GasFeeEstimation> {
    const signer = this.web3.getConnectedSigner();
    const simpleStorage = SimpleStorage__factory.connect(
      this.simpleStoragePluginAddress,
      signer,
    );
    const estimation = await simpleStorage.estimateGas.storeNumber(number);
    return this.web3.getApproximateGasFee(estimation.toBigInt());
  }
}
