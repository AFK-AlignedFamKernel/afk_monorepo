import {LAUNCHPAD_ADDRESS} from 'common';
import {AccountInterface, CallData, constants} from 'starknet';

// import { LAUNCHPAD_ADDRESS, UNRUGGABLE_FACTORY_ADDRESS } from "../../constants/contracts";
import {formatFloatToUint256} from '../../utils/format';

export type DeployTokenFormValues = {
  recipient?: string;
  name: string | undefined;
  symbol: string | undefined;
  initialSupply: number | undefined;
  contract_address_salt: string | undefined;
};

export const useCreateToken = () => {
  const deployToken = async (account: AccountInterface, data: DeployTokenFormValues) => {
    const CONTRACT_ADDRESS_SALT_DEFAULT =
      data?.contract_address_salt ??
      ((await account?.getChainId()) == constants.StarknetChainId.SN_MAIN
        ? '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6'
        : '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6');

    console.log('deployCall');

    const initial_supply = formatFloatToUint256(data?.initialSupply ?? 100_000_000);

    console.log('initial supply', initial_supply);
    const deployCall = {
      contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
      entrypoint: 'create_token',
      calldata: CallData.compile({
        owner: data?.recipient ?? account?.address,
        symbol: data.symbol ?? 'LFG',
        name: data.name ?? 'LFG',
        initialSupply: initial_supply,
        // initialSupply: cairo.uint256(data?.initialSupply ?? 100_000_000),
        contract_address_salt: new Date().getTime(),
        // contract_address_salt:CONTRACT_ADDRESS_SALT_DEFAULT + Math.random() + Math.random() / 1000
        // contract_address_salt:cairo.felt(Math.random())
      }),
    };
    console.log('deployCall', deployCall);

    const tx = await account.execute(deployCall);
    console.log('tx', tx);

    console.log('tx hash', tx.transaction_hash);
    const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
    return wait_tx;
  };

  const deployTokenAndLaunch = async (account: AccountInterface, data: DeployTokenFormValues) => {
    const CONTRACT_ADDRESS_SALT_DEFAULT =
      data?.contract_address_salt ??
      ((await account?.getChainId()) == constants.StarknetChainId.SN_MAIN
        ? '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6'
        : '0x36d8be2991d685af817ef9d127ffb00fbb98a88d910195b04ec4559289a99f6');

    const initial_supply = formatFloatToUint256(data?.initialSupply ?? 100_000_000);

    console.log('initial supply', initial_supply);
    const deployCall = {
      contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
      entrypoint: 'create_and_launch_token',
      calldata: CallData.compile({
        name: data.name ?? 'LFG',
        symbol: data.symbol ?? 'LFG',
        initialSupply: initial_supply,
        contract_address_salt: new Date().getTime(),
      }),
    };

    const tx = await account.execute(deployCall);
    console.log('tx hash', tx.transaction_hash);
    const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
    return wait_tx;
  };

  const launchToken = async (account: AccountInterface, coin_address: string) => {
    const deployCall = {
      contractAddress: LAUNCHPAD_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
      entrypoint: 'launch_token',
      calldata: CallData.compile({
        coin_address,
      }),
    };

    const tx = await account.execute(deployCall);
    console.log('tx hash', tx.transaction_hash);
    const wait_tx = await account?.waitForTransaction(tx?.transaction_hash);
    return wait_tx;
  };

  return {
    deployToken,
    deployTokenAndLaunch,
    launchToken,
  };
};
