import { ec, RpcProvider, constants } from 'starknet';
import backendConfigProd from '../configs/backend.config.json';
import backendConfigDev from '../configs/backend.dev.config.json';
const isProduction = process.env.NEXT_PUBLIC_NODE_ENV == "true" ||
  process.env.NEXT_PUBLIC_NODE_ENV == "production" || process.env.EXPO_PUBLIC_NODE_ENV == "production" ? true : false
/** TODO add ENV and config for prod and test */
/** TODO fix url */
const backendConfig = isProduction ? backendConfigProd : backendConfigDev
const isLocal = backendConfig.local

console.log("isProduction", isProduction)

export const backendUrl = isProduction && !isLocal
  ? 'https://' + typeof process.env.NEXT_PUBLIC_BACKEND_URL !== "undefined" ? process.env.NEXT_PUBLIC_BACKEND_URL : backendConfig.host
  : 'http://' + backendConfig.host + ':' + backendConfig.port;
console.log("backendUrl", backendUrl)

export const wsUrl = isProduction && !isLocal
  // ? 'wss://' + backendConfig.host + '/ws'
  ? 'wss://' + typeof process.env.NEXT_PUBLIC_BACKEND_URL !== "undefined" ? process.env.NEXT_PUBLIC_BACKEND_URL + "/ws" : backendConfig.host + "/ws"
  : 'ws://' + backendConfig.host + ':' + backendConfig.consumer_port + '/ws';
console.log("wsUrl", wsUrl)

export const nftUrl = isProduction && !isLocal
  ? 'https://' + typeof process.env.NEXT_PUBLIC_BACKEND_URL !== "undefined" ? process.env.NEXT_PUBLIC_BACKEND_URL : backendConfig.host
  : 'http://' + backendConfig.host + ':' + backendConfig.consumer_port;

console.log("nftUrl", nftUrl)

export const templateUrl = isProduction && !isLocal
  ? 'https://' + typeof process.env.NEXT_PUBLIC_BACKEND_URL !== "undefined" ? process.env.NEXT_PUBLIC_BACKEND_URL : backendConfig.host
  : 'http://' + typeof process.env.NEXT_PUBLIC_BACKEND_URL !== "undefined" ? process.env.NEXT_PUBLIC_BACKEND_URL : backendConfig.host + ':' + backendConfig.port;

console.log("templateUrl", templateUrl)

console.log("nftUrl", nftUrl)

export const devnetMode = backendConfig.production === false;
// export const devnetMode = backendConfig.production === false;
export const convertUrl = (url) => {
  if (!url) {
    return url;
  }
  return url.replace('$BACKEND_URL', backendUrl);
};

export const getProvider = (chainId) => {
  const provider = new RpcProvider({
    nodeUrl: process.env.NEXT_PUBLIC_PROVIDER_URL,
    chainId: chainId ?? constants.StarknetChainId.SN_SEPOLIA
  });
  return provider
}

export const provider = new RpcProvider({
  nodeUrl: process.env.PROVIDER_URL,
  chainId: process.env.STARKNET_CHAIN_ID ?? constants.StarknetChainId.SN_SEPOLIA
});


export const allowedMethods = [
  {
    'Contract Address': process.env.REACT_APP_USERNAME_STORE_CONTRACT_ADDRESS,
    selector: 'claim_username'
  },
  {
    'Contract Address': process.env.REACT_APP_USERNAME_STORE_CONTRACT_ADDRESS,
    selector: 'change_username'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'claim_today_quest'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'claim_main_quest'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'vote_color'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'place_extra_pixels'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'add_faction_template'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'join_faction'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'join_chain_faction'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'add_chain_faction_template'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'mint_nft'
  },
  {
    'Contract Address': process.env.REACT_APP_CANVAS_NFT_CONTRACT_ADDRESS,
    selector: 'like_nft'
  },
  {
    'Contract Address': process.env.REACT_APP_CANVAS_NFT_CONTRACT_ADDRESS,
    selector: 'unlike_nft'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'increase_day_index'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'place_pixel'
  }
];

export const expiry = Math.floor((Date.now() + 1000 * 60 * 60 * 24) / 1000);


export const parseUnits = (value, decimals) => {
  let [integer, fraction = ''] = value.split('.');

  const negative = integer.startsWith('-');
  if (negative) {
    integer = integer.slice(1);
  }

  // If the fraction is longer than allowed, round it off
  if (fraction.length > decimals) {
    const unitIndex = decimals;
    const unit = Number(fraction[unitIndex]);

    if (unit >= 5) {
      /* global BigInt */
      const fractionBigInt = BigInt(fraction.slice(0, decimals)) + BigInt(1);
      fraction = fractionBigInt.toString().padStart(decimals, '0');
    } else {
      fraction = fraction.slice(0, decimals);
    }
  } else {
    fraction = fraction.padEnd(decimals, '0');
  }

  const parsedValue = BigInt(`${negative ? '-' : ''}${integer}${fraction}`);

  return {
    value: parsedValue,
    decimals
  };
};

// TODO: Allow STRK fee tokens
export const metaData = (isStarkFeeToken) => ({
  projectID: 'art-peace',
  txFees: isStarkFeeToken ? [] : ETHFees
});

export const privateKey = ec.starkCurve.utils.randomPrivateKey();
export const dappKey = {
  privateKey: privateKey,
  publicKey: ec.starkCurve.getStarkKey(privateKey)
};
export const ETHTokenAddress =
  '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

const ETHFees =
  process.env.NEXT_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? [
      {
        tokenAddress: ETHTokenAddress,
        maxAmount: parseUnits('0.001', 18).value.toString()
      }
    ]
    : [
      {
        tokenAddress: ETHTokenAddress,
        maxAmount: parseUnits('0.1', 18).value.toString()
      }
    ];
