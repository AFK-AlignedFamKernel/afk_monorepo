import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { uint256, validateAndParseAddress } from 'starknet';
import { ContractAddress } from '../../common/types';
import { formatUnits } from 'viem';
import constants from '../../common/constants';
import { apibara } from '@apibara/starknet/dist/proto/generated';
import IFieldElement = apibara.starknet.v1alpha2.IFieldElement;

export function getEventTxData(
  header: starknet.IBlockHeader,
  transaction: starknet.ITransaction,
) {
  const {
    blockNumber,
    blockHash: blockHashFelt,
    timestamp: blockTimestamp,
  } = header;

  const blockHash = validateAndParseAddress(
    `0x${FieldElement.toBigInt(blockHashFelt).toString(16)}`,
  ) as ContractAddress;

  const transactionHashFelt = transaction.meta.hash;
  const transactionHash = validateAndParseAddress(
    `0x${FieldElement.toBigInt(transactionHashFelt).toString(16)}`,
  ) as ContractAddress;

  return {
    network: 'starknet-sepolia',
    transactionHash,
    blockNumber: Number(blockNumber),
    blockHash,
    blockTimestamp: new Date(Number(blockTimestamp.seconds) * 1000),
  };
}

export function feltToAddress(addressFelt: IFieldElement) {
  return validateAndParseAddress(
    `0x${FieldElement.toBigInt(addressFelt).toString(16)}`,
  ) as ContractAddress;
}

export function uint256ToHex(lowFelt: IFieldElement, highFelt: IFieldElement) {
  return uint256
    .uint256ToBN({
      low: FieldElement.toBigInt(lowFelt),
      high: FieldElement.toBigInt(highFelt),
    })
    .toString(16);
}

export function uint256ToAmount(
  lowFelt: IFieldElement,
  highFelt: IFieldElement,
) {
  const rawData = uint256.uint256ToBN({
    low: FieldElement.toBigInt(lowFelt),
    high: FieldElement.toBigInt(highFelt),
  });
  return Number(formatUnits(rawData, constants.DECIMALS));
}
