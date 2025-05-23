import { constants } from "starknet"

export const ARGENT_WEBWALLET_URL =
    process.env.NEXT_PUBLIC_ARGENT_WEBWALLET_URL ||
    "https://sepolia-web.argent.xyz"


export const CHAIN_ID =
    process.env.NEXT_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
        ? constants.NetworkName.SN_MAIN
        : constants.NetworkName.SN_SEPOLIA