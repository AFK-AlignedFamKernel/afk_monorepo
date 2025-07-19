import { FieldElement } from "@apibara/starknet";
import { shortString } from "starknet";

export const isNumeric = (str: string): boolean => {
    console.log("str", str);
    return /^\d+$/.test(str);
};


export const isValidChar = (char: string): boolean => {
    return /^[a-zA-Z0-9\s\-_.!@#$%^&*()/:]+$/.test(char);
};
export const cleanString = (str: string): string => {
    return str
        .split('')
        .filter((char) => isValidChar(char))
        .join('')
        .trim();
};


export const convertByteArray = (data:any, i: number) => {
    let url = '';
    try {
        while (i < data.length) {
            const part = data[i];
            const decodedPart = shortString.decodeShortString(
                FieldElement.toBigInt(part).toString(),
            );

            if (isNumeric(decodedPart)) {
                i++;
                break;
            }

            url += decodedPart;
            i++;
        }

        url = cleanString(url);
        console.log("url", url);
    } catch (error) {
        console.log("error bytearray", error);
    }
    return url; 
}