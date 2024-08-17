import {
    provider,
} from "../utils/starknet";
import { Account, cairo, constants } from "starknet";
import { CLASS_HASH, ESCROW_ADDRESS, JEDISWAP_V2_FACTORY, JEDISWAP_V2_NFT_ROUTER, TOKENS_ADDRESS, } from "../constants";
import dotenv from "dotenv";
import { prepareAndConnectContract } from "../utils/contract";
import { createLaunchpad } from "../utils/launchpad";
dotenv.config();

export const deployLaunchpad = async () => {
    console.log("deployLaunchpad")

    let launchpad;

    let launchpad_address: string | undefined = ESCROW_ADDRESS[constants.StarknetChainId.SN_SEPOLIA] as any // change default address
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
    const account = new Account(provider, accountAddress0, privateKey0, "1");

    const chainId = await provider.getChainId()
    // const TOKEN_QUOTE_ADDRESS= TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK;
    const TOKEN_QUOTE_ADDRESS = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].BIG_TOKEN;

    let JEDISWAP_ADDRESS_NFT = JEDISWAP_V2_NFT_ROUTER[constants.StarknetChainId.SN_SEPOLIA];
    let JEDISWAP_FACTORY_ADDRESS = JEDISWAP_V2_FACTORY[constants.StarknetChainId.SN_SEPOLIA];

    if (chainId == constants.StarknetChainId.SN_SEPOLIA) {
        JEDISWAP_ADDRESS_NFT = JEDISWAP_V2_NFT_ROUTER[constants.StarknetChainId.SN_MAIN]
        JEDISWAP_FACTORY_ADDRESS = JEDISWAP_V2_FACTORY[constants.StarknetChainId.SN_MAIN]
    }
    const initial_key_price = cairo.uint256(1);
    const step_increase_linear = cairo.uint256(1);
    const threshold_liquidity = cairo.uint256(1000);
    const threshold_marketcap = cairo.uint256(5000);
    const TOKEN_CLASS_HASH = CLASS_HASH.TOKEN[constants.StarknetChainId.SN_SEPOLIA]
    if (process.env.IS_DEPLOY_CONTRACT == "true") {
        let launchpadContract = await createLaunchpad(
            TOKEN_QUOTE_ADDRESS,
            initial_key_price,
            step_increase_linear,
            TOKEN_CLASS_HASH,
            threshold_liquidity,
            threshold_marketcap,

        );
        console.log("escrow address", launchpadContract?.contract_address)
        if (launchpadContract?.contract_address) {
            launchpad_address = launchpadContract?.contract_address
            launchpad = await prepareAndConnectContract(launchpad_address ?? launchpadContract?.contract_address, account)
          
            // Setup params
            launchpad.set_address_jediswap_factory_v2(JEDISWAP_FACTORY_ADDRESS);

            // NFT position address to add liquidity
            launchpad.set_address_jediswap_nft_router_v2(JEDISWAP_ADDRESS_NFT);
        }

    } else {

    }

    /** TODO script to save constants address */

    return {
        launchpad, launchpad_address
    }
}

deployLaunchpad()