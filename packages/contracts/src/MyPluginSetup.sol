// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.8;

import {PermissionLib} from "@aragon/osx-commons-contracts/src/permission/PermissionLib.sol";
import {ProxyLib} from "@aragon/osx-commons-contracts/src/utils/deployment/ProxyLib.sol";
import {PluginUpgradeableSetup} from "@aragon/osx-commons-contracts/src/plugin/setup/PluginUpgradeableSetup.sol";
import {IPluginSetup} from "@aragon/osx-commons-contracts/src/plugin/setup/IPluginSetup.sol";
import {IDAO} from "@aragon/osx-commons-contracts/src/dao/IDAO.sol";

import {MyPlugin} from "./MyPlugin.sol";

/// @title MyPluginSetup
/// @dev Release 1, Build 1
contract MyPluginSetup is PluginUpgradeableSetup {
    using ProxyLib for address;

    /// @notice Constructs the `PluginUpgradeableSetup` by storing the `MyPlugin` implementation address.
    /// @dev The implementation address is used to deploy UUPS proxies referencing it and
    /// to verify the plugin on the respective block explorers.
    constructor() PluginUpgradeableSetup(address(new MyPlugin())) {}

    /// @notice The ID of the permission required to call the `storeNumber` function.
    bytes32 internal constant STORE_PERMISSION_ID = keccak256("STORE_PERMISSION");

    /// @inheritdoc IPluginSetup
    function prepareInstallation(
        address _dao,
        bytes memory _data
    ) external returns (address plugin, PreparedSetupData memory preparedSetupData) {
        uint256 number = abi.decode(_data, (uint256));

        plugin = IMPLEMENTATION.deployUUPSProxy(
            abi.encodeCall(MyPlugin.initialize, (IDAO(_dao), number))
        );

        PermissionLib.MultiTargetPermission[]
            memory permissions = new PermissionLib.MultiTargetPermission[](1);

        permissions[0] = PermissionLib.MultiTargetPermission({
            operation: PermissionLib.Operation.Grant,
            where: plugin,
            who: _dao,
            condition: PermissionLib.NO_CONDITION,
            permissionId: STORE_PERMISSION_ID
        });

        preparedSetupData.permissions = permissions;
    }

    /// @inheritdoc IPluginSetup
    /// @dev The default implementation for the initial build 1 that reverts because no earlier build exists.
    function prepareUpdate(
        address _dao,
        uint16 _fromBuild,
        SetupPayload calldata _payload
    ) external pure virtual returns (bytes memory, PreparedSetupData memory) {
        (_dao, _fromBuild, _payload);
        revert InvalidUpdatePath({fromBuild: 0, thisBuild: 1});
    }

    /// @inheritdoc IPluginSetup
    function prepareUninstallation(
        address _dao,
        SetupPayload calldata _payload
    ) external pure returns (PermissionLib.MultiTargetPermission[] memory permissions) {
        permissions = new PermissionLib.MultiTargetPermission[](1);

        permissions[0] = PermissionLib.MultiTargetPermission({
            operation: PermissionLib.Operation.Revoke,
            where: _payload.plugin,
            who: _dao,
            condition: PermissionLib.NO_CONDITION,
            permissionId: STORE_PERMISSION_ID
        });
    }
}
