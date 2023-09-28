import { IMyPluginClientEncoding } from "../interfaces";
import { ClientCore, DaoAction } from "@aragon/sdk-client-common";
import { hexToBytes } from "@aragon/sdk-common";
import { MyPlugin__factory } from "../../../../contracts/typechain";
import { MyPluginContext } from "../../context";

export class MyPluginClientEncoding extends ClientCore
  implements IMyPluginClientEncoding {
  private myPluginAddress: string;

  constructor(context: MyPluginContext) {
    super(context);

    this.myPluginAddress = context.myPluginAddress;
  }

  // implementation of the methods in the interface
  public storeNumberAction(number: bigint): DaoAction {
    const iface = MyPlugin__factory.createInterface();
    const data = iface.encodeFunctionData("storeNumber", [number]);
    return {
      to: this.myPluginAddress,
      value: BigInt(0),
      data: hexToBytes(data),
    };
  }
}
