// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.8;

/**
 * @title Migration
 *
 * @dev This file allows importing contracts to obtain compiler artifacts for testings purposes.
 *
 * After a contract is imported here and the project is compiled, an associated artifact will be
 * generated inside artifacts/@aragon/{version-name}/*,
 * and TypeChain typings will be generated inside typechain/osx-version/{version-name}/*
 * for type-safe interactions with the contract in our tests.
 */

/* solhint-disable no-unused-import */

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Regression Testing
import {TokenVoting as TokenVoting_v1_0_1} from "@aragon/osx-v1.0.1/plugins/governance/majority-voting/token/TokenVoting.sol";
import {TokenVoting as TokenVoting_v1_3_0} from "@aragon/osx-v1.3.0/plugins/governance/majority-voting/token/TokenVoting.sol";

import {GovernanceERC20 as GovernanceERC20_v1_0_0} from "@aragon/osx-v1.0.1/token/ERC20/governance/GovernanceERC20.sol";
import {GovernanceERC20 as GovernanceERC20_v1_3_0} from "@aragon/osx-v1.3.0/token/ERC20/governance/GovernanceERC20.sol";

import {GovernanceWrappedERC20 as GovernanceWrappedERC20_v1_0_0} from "@aragon/osx-v1.0.1/token/ERC20/governance/GovernanceWrappedERC20.sol";
import {GovernanceWrappedERC20 as GovernanceWrappedERC20_v1_3_0} from "@aragon/osx-v1.3.0/token/ERC20/governance/GovernanceWrappedERC20.sol";

import {ProxyFactory} from "@aragon/osx-commons-contracts/src/utils/deployment/ProxyFactory.sol";

/* solhint-enable no-unused-import */
