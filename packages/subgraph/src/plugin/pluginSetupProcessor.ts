import {
  InstallationApplied,
  InstallationPrepared,
  UninstallationApplied,
  UninstallationPrepared,
  UpdateApplied,
  UpdatePrepared,
} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
import {Plugin, PluginPreparation} from '../../generated/schema';

/////////////////
// InstallationPrepared
/////////////////
export function updatePreparationDataForInstallationPrepared(
  pluginPreparationEntity: PluginPreparation,
  event: InstallationPrepared
): void {
  // Add `PluginPreparation` specific data for this plugin

  // Remove: the following code is used to silence the linter
  pluginPreparationEntity;
  event;
}

export function updatePluginDataForInstallationPrepared(
  pluginEntity: Plugin,
  event: InstallationPrepared
): void {
  // Add `Plugin` specific data for this plugin
  //   pluginEntity.onlyListed = false;
  //   pluginEntity.proposalCount = BigInt.zero();

  // Remove: the following code is used to silence the linter
  pluginEntity;
  event;
}

/////////////////
// InstallationApplied
/////////////////
export function updatePluginDataForInstallationApplied(
  pluginEntity: Plugin,
  event: InstallationApplied
): void {
  // Add `Plugin` specific data for this plugin

  // Remove: the following code is used to silence the linter
  pluginEntity;
  event;
}

/////////////////
// UpdatePrepared
/////////////////
export function updatePreparationDataForUpdatePrepared(
  pluginPreparationEntity: PluginPreparation,
  event: UpdatePrepared
): void {
  // Add `PluginPreparation` specific data for this plugin

  // Remove: the following code is used to silence the linter
  pluginPreparationEntity;
  event;
}

export function updatePluginDataForUpdatePrepared(
  pluginEntity: Plugin,
  event: UpdatePrepared
): void {
  // Add `Plugin` specific data for this plugin

  // Remove: the following code is used to silence the linter
  pluginEntity;
  event;
}

/////////////////
// UpdateApplied
/////////////////
export function updatePluginDataForUpdateApplied(
  pluginEntity: Plugin,
  event: UpdateApplied
): void {
  // Add `Plugin` specific data for this plugin

  // Remove: the following code is used to silence the linter
  pluginEntity;
  event;
}

/////////////////
// UninstallationPrepared
/////////////////
export function updatePreparationDataForUninstallationPrepared(
  pluginPreparationEntity: PluginPreparation,
  event: UninstallationPrepared
): void {
  // Add `PluginPreparation` specific data for this plugin

  // Remove: the following code is used to silence the linter
  pluginPreparationEntity;
  event;
}

export function updatePluginDataForUninstallationPrepared(
  pluginEntity: Plugin,
  event: UninstallationPrepared
): void {
  // Add `Plugin` specific data for this plugin
  //   pluginEntity.onlyListed = false;
  //   pluginEntity.proposalCount = BigInt.zero();

  // Remove: the following code is used to silence the linter
  pluginEntity;
  event;
}

/////////////////
// InstallationApplied
/////////////////
export function updatePluginDataForUninstallationApplied(
  pluginEntity: Plugin,
  event: UninstallationApplied
): void {
  // Add `Plugin` specific data for this plugin

  // Remove: the following code is used to silence the linter
  pluginEntity;
  event;
}
