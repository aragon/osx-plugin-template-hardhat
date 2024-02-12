import {DaoPlugin} from '../../generated/schema';
import {handleNumberStored} from '../../src/plugin/plugin';
import {CONTRACT_ADDRESS, DAO_ADDRESS} from '../utils/constants';
import {createNewNumberStoredEvent} from '../utils/events';
import {generatePluginInstallationEntityId} from '@aragon/osx-commons-subgraph';
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

      const installationId = generatePluginInstallationEntityId(
        daoAddress,
        pluginAddress
      );
      if (!installationId) {
        throw new Error('Failed to get installationId');
      }
      // Create state
      let daoPlugin = new DaoPlugin(installationId!);
      daoPlugin.dao = daoAddress;
      daoPlugin.pluginAddress = pluginAddress;
      daoPlugin.save();

      const number = '5';

      const event = createNewNumberStoredEvent(
        number,
        pluginAddress.toHexString()
      );

      handleNumberStored(event);

      assert.fieldEquals('DaoPlugin', installationId!, 'id', installationId!);
      assert.fieldEquals('DaoPlugin', installationId!, 'number', number);
      assert.entityCount('DaoPlugin', 1);
    });
  });
});
