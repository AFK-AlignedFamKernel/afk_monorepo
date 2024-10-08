import { cairo, Uint256, uint256 } from "starknet";

export const feltToAddress = (felt: bigint) => {
  const newStrB = Buffer.from(felt.toString(16), "ascii");
  return `0x${newStrB.toString()}`;
};

export const formatFloatToUint256 = (
  total_amount_float: number,
  decimals = 18
) => {
  let total_amount: Uint256 | undefined;
  const total_amount_nb = total_amount_float * 10 ** Number(decimals);

  if (Number.isInteger(total_amount_float)) {
    total_amount = cairo.uint256(total_amount_nb);
  } else {
    total_amount = uint256.bnToUint256(BigInt(total_amount_nb));
  }

  return total_amount;
};
