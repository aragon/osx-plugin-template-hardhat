# Multisig Plugin

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to the [Aragon OSx Plugin Versioning Convention](https://devs.aragon.org/docs/osx/how-to-guides/plugin-development/publication/versioning).

## v1.3

### Added

- Copied files from [aragon/osx commit 1130df](https://github.com/aragon/osx/commit/1130dfce94fd294c4341e91a8f3faccc54cf43b7)

### Changed

- Used `ProxyLib` from `osx-commons-contracts` for the minimal proxy deployment in `MultisigSetup`.
- Hard-coded the `bytes32 internal constant EXECUTE_PERMISSION_ID` constant in `MultisigSetup` until it is available in `PermissionLib`.
