import {cairo, Uint256, uint256, shortString} from 'starknet';

export const feltToAddress = (felt: bigint) => {
  const newStrB = Buffer.from(felt.toString(16), 'ascii');
  return `0x${newStrB.toString()}`;
};

export const formatFloatToUint256 = (total_amount_float: number, decimals = 18) => {
  let total_amount: Uint256 | undefined;
  const total_amount_nb = total_amount_float * 10 ** Number(decimals);

  if (Number.isInteger(total_amount_float)) {
    total_amount = cairo.uint256(total_amount_nb);
  } else {
    total_amount = uint256.bnToUint256(BigInt(total_amount_nb));
  }

  return total_amount;
};

export const decodeUsername = (hexUsername: string): string => {
  try {
    return shortString.decodeShortString(hexUsername.replace(/0x0+/, '0x'));
  } catch (error) {
    console.error('Error decoding username:', error);
    return hexUsername;
  }
};

export const formatExpiry = (hexExpiry: string): Date => {
  const timestamp = parseInt(hexExpiry, 16);
  return new Date(timestamp * 1000);
};

export const numericValue = (text: string): number | any => {
  // Allow numbers and a single decimal point
  const parts = text.split('.');
  const cleanedText =
    parts.length > 2
      ? parts[0] + '.' + parts.slice(1).join('').replace(/\./g, '')
      : text.replace(/[^0-9.]/g, '');

  // Convert to number and handle edge cases
  const number = parseFloat(cleanedText);

  // Return 0 if the input is empty or not a valid number
  return isNaN(number) ? 0 : number;
};

export const formatNumber = (value: string | number, decimals = 4): string => {
  if (!value) return '0';

  const num = typeof value === 'string' ? parseFloat(value) : value;

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};
