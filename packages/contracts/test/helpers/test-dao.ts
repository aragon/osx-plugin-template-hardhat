import {DAO, DAO__factory} from '../../typechain';
import {deployWithProxy} from '../../utils/helpers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

export async function deployTestDao(signer: SignerWithAddress): Promise<DAO> {
  const DAO = new DAO__factory(signer);
  const dao = await deployWithProxy<DAO>(DAO);

  const daoExampleURI = 'https://example.com';

  await dao.initialize(
    '',
    signer.address,
    ethers.constants.AddressZero,
    daoExampleURI
  );

  return dao;
}
