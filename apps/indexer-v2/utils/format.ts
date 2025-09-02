import { Uint256 } from "starknet";
import { cairo } from "starknet";
import { uint256 } from "starknet";

export const feltToAddress = (felt: bigint) => {
    const newStrB = Buffer.from(felt.toString(16), 'ascii');
    return `0x${newStrB.toString()}`;
};

export const formatFloatToUint256 = (total_amount_float?: number, decimals = 18) => {

    try {
        if (!total_amount_float) {
            return cairo.uint256(0);
        }
        let total_amount: Uint256 | undefined;
        const total_amount_nb = total_amount_float * 10 ** Number(decimals);
    
        if (Number.isInteger(total_amount_float)) {
            total_amount = cairo.uint256(total_amount_nb);
        } else {
            total_amount = uint256.bnToUint256(BigInt(total_amount_nb));
        }
    
        return total_amount;
    } catch (error) {
        console.error("Error formatting float to uint256:", error);
        return cairo.uint256(0);
    }
};        



export const formatBigIntToFloat = (total_amount_float?: BigInt, decimals = 18) => {

    try {
       

        console.log("total_amount_float", total_amount_float);
        const total_amount_nb = Number(total_amount_float) / 10 ** Number(decimals);

        console.log("total_amount_nb", total_amount_nb);
        return total_amount_nb.toString();
    
    } catch (error) {
        console.error("Error formatting float to uint256:", error);
        return "0";
    }
};        

