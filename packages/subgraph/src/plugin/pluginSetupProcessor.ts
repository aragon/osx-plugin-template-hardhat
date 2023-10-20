import {
  InstallationApplied,
  InstallationPrepared,
  UninstallationApplied,
  UninstallationPrepared,
  UpdateApplied,
  UpdatePrepared,
} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
import {DaoPlugin} from '../../generated/schema';

/////////////////
// InstallationPrepared
/////////////////
export function updatePluginDataForInstallationPrepared(
  pluginEntity: DaoPlugin,
  event: InstallationPrepared
): void {
  // Add `Plugin` specific data for this plugin

  // Remove: the following code is used to silence the linter
  pluginEntity;
  event;
}

/////////////////
// InstallationApplied
/////////////////
export function updatePluginDataForInstallationApplied(
  pluginEntity: DaoPlugin,
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
export function updatePluginDataForUpdatePrepared(
  pluginEntity: DaoPlugin,
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
  pluginEntity: DaoPlugin,
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
export function updatePluginDataForUninstallationPrepared(
  pluginEntity: DaoPlugin,
  event: UninstallationPrepared
): void {
  // Add `Plugin` specific data for this plugin

  // Remove: the following code is used to silence the linter
  pluginEntity;
  event;
}

/////////////////
// InstallationApplied
/////////////////
export function updatePluginDataForUninstallationApplied(
  pluginEntity: DaoPlugin,
  event: UninstallationApplied
): void {
  // Add `Plugin` specific data for this plugin

  // Remove: the following code is used to silence the linter
  pluginEntity;
  event;
}
