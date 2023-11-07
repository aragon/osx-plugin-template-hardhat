import {getPluginInstallationId} from '../../commons/ids';
import {DaoPlugin} from '../../generated/schema';
import {handleNumberStored} from '../../src/plugin/plugin';
import {CONTRACT_ADDRESS, DAO_ADDRESS} from '../utils/constants';
import {createNewNumberStoredEvent} from './utils';
import {Address, DataSourceContext} from '@graphprotocol/graph-ts';
import {
  assert,
  afterEach,
  beforeEach,
  clearStore,
  test,
  describe,
  dataSourceMock,
} from 'matchstick-as';

describe('Plugin', () => {
  beforeEach(function () {
    let context = new DataSourceContext();
    context.setString('daoAddress', DAO_ADDRESS);
    dataSourceMock.setContext(context);
  });

  afterEach(() => {
    clearStore();
  });

  describe('NumberStored Event', () => {
    test('it should store the correct number emitted from the event', () => {
      const daoAddress = Address.fromString(DAO_ADDRESS);
      const pluginAddress = Address.fromString(CONTRACT_ADDRESS);

      const installationId = getPluginInstallationId(daoAddress, pluginAddress);
      if (!installationId) {
        throw new Error('Failed to get installationId');
      }
      const installationIdString = installationId.toHexString();

      // Create state
      let daoPlugin = new DaoPlugin(installationIdString);
      daoPlugin.dao = daoAddress;
      daoPlugin.pluginAddress = pluginAddress;
      daoPlugin.save();

      const number = '5';

      const event = createNewNumberStoredEvent(
        number,
        pluginAddress.toHexString()
      );

      handleNumberStored(event);

      assert.fieldEquals(
        'DaoPlugin',
        installationIdString,
        'id',
        installationIdString
      );
      assert.fieldEquals('DaoPlugin', installationIdString, 'number', number);
      assert.entityCount('DaoPlugin', 1);
    });
  });
});
