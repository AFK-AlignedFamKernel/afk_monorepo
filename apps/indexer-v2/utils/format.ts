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
        if (!total_amount_float || total_amount_float === 0n) {
            return "0";
        }

        console.log("total_amount_float", total_amount_float);
        
        // Convert BigInt to string first to avoid precision loss
        const amountStr = total_amount_float.toString();
        
        // Handle very large numbers by using string manipulation
        if (amountStr.length <= decimals) {
            // Number is smaller than 1, add leading zeros
            const padded = amountStr.padStart(decimals + 1, '0');
            const integerPart = padded.slice(0, -decimals);
            const decimalPart = padded.slice(-decimals);
            
            // Remove trailing zeros from decimal part
            const trimmedDecimal = decimalPart.replace(/0+$/, '');
            
            if (trimmedDecimal === '') {
                return integerPart;
            } else {
                return `${integerPart}.${trimmedDecimal}`;
            }
        } else {
            // Number is >= 1, use normal division
            const total_amount_nb = Number(total_amount_float) / 10 ** Number(decimals);
            console.log("total_amount_nb", total_amount_nb);
            return total_amount_nb.toString();
        }
    
    } catch (error) {
        console.error("Error formatting BigInt to float:", error);
        return "0";
    }
};

// Helper function to convert float string back to BigInt with proper precision
export const formatFloatToBigInt = (floatStr: string, decimals = 18): bigint => {
    try {
        if (!floatStr || floatStr === '0' || floatStr === 'NaN' || floatStr === 'Infinity') {
            return 0n;
        }
        
        // Handle scientific notation
        let normalizedStr = floatStr;
        if (floatStr.includes('e-') || floatStr.includes('e+')) {
            normalizedStr = parseFloat(floatStr).toString();
        }
        
        // Split into integer and decimal parts
        const [integerPart, decimalPart = ''] = normalizedStr.split('.');
        
        // Pad decimal part to required precision
        const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
        
        // Combine integer and decimal parts
        const fullNumberStr = integerPart + paddedDecimal;
        
        return BigInt(fullNumberStr);
    } catch (error) {
        console.error("Error converting float to BigInt:", error, floatStr);
        return 0n;
    }
};        

