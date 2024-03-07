// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.8;

/**
 * @title Migration
 *
 * @dev This file allows importing contracts to obtain compiler artifacts for testing purposes.
 *
 * After a contract is imported here and the project is compiled, an associated artifact will be
 * generated inside artifacts/@aragon/{version-name}/*,
 * and TypeChain typings will be generated inside typechain/osx-version/{version-name}/*
 * for type-safe interactions with the contract in our tests.
 */

/* solhint-disable no-unused-import */
/* solhint-disable  max-line-length */
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Regression Testing
import {Multisig as Multisig_v1_1} from "@aragon/osx-v1.0.0/plugins/governance/multisig/Multisig.sol";
import {Multisig as Multisig_v1_2} from "@aragon/osx-v1.3.0/plugins/governance/multisig/Multisig.sol";

import {ProxyFactory} from "@aragon/osx-commons-contracts/src/utils/deployment/ProxyFactory.sol";

/* solhint-enable  max-line-length */
/* solhint-enable no-unused-import */
