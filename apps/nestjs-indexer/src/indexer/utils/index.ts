import { FieldElement, v1alpha2 as starknet } from '@apibara/starknet';
import { Logger } from '@nestjs/common';

export function safeUint256ToBN(
  lowFelt: starknet.IFieldElement,
  highFelt: starknet.IFieldElement,
): bigint {
  try {
    // Convert FieldElements to BigInts directly
    const low = FieldElement.toBigInt(lowFelt);
    const high = FieldElement.toBigInt(highFelt);

    Logger.debug(`Converting uint256 - low: ${low}, high: ${high}`);

    // Validate the low and high values
    const UINT_128_MAX = BigInt('0xffffffffffffffffffffffffffffffff');
    if (low > UINT_128_MAX || high > UINT_128_MAX) {
      Logger.warn(`Low or high value exceeds maximum ${UINT_128_MAX}`);
      // Handle overflow by capping at max value
      return UINT_128_MAX;
    }

    // Combine high and low parts into a single bigint
    const fullValue = (high << BigInt(128)) + low;

    Logger.debug(`Full value: ${fullValue}`);

    return fullValue;
  } catch (error) {
    Logger.error('Error converting uint256:', error);
    return BigInt(0);
  }
}
