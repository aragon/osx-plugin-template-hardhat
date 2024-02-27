// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.8;

import {PluginUUPSUpgradeable} from "@aragon/osx-commons-contracts/src/plugin/PluginUUPSUpgradeable.sol";
import {IDAO} from "@aragon/osx-commons-contracts/src/dao/IDAO.sol";

/// @title MyPlugin
/// @dev Release 1, Build 1
contract MyPlugin is PluginUUPSUpgradeable {
    /// @notice The ID of the permission required to call the `storeNumber` function.
    bytes32 public constant STORE_PERMISSION_ID = keccak256("STORE_PERMISSION");

    uint256 public number; // added in build 1

    /// @notice Emitted when a number is stored.
    /// @param number The number.
    event NumberStored(uint256 number);

    /// @notice Disables the initializers on the implementation contract to prevent it from being left uninitialized.
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the plugin when build 1 is installed.
    /// @param _number The number to be stored.
    function initialize(IDAO _dao, uint256 _number) external initializer {
        __PluginUUPSUpgradeable_init(_dao);
        number = _number;

        emit NumberStored({number: _number});
    }

    /// @notice Stores a new number to storage. Caller needs STORE_PERMISSION.
    /// @param _number The number to be stored.
    function storeNumber(uint256 _number) external auth(STORE_PERMISSION_ID) {
        number = _number;

        emit NumberStored({number: _number});
    }
}
