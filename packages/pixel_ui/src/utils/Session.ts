// import dotenv from "dotenv"

import { AllowedMethod } from '@argent/x-sessions';
import { constants, ec } from 'starknet';


const ART_PEACE_CONTRACT=process.env.NEXT_PUBLIC_USERNAME_STORE_CONTRACT_ADDRESS ?? ""
const USERNAME_CONTRACT=process.env.NEXT_PUBLIC_USERNAME_STORE_CONTRACT_ADDRESS ?? ""
const CANVAS_NFT_CONTRACT_ADDRESS=process.env.NEXT_PUBLIC_CANVAS_NFT_CONTRACT_ADDRESS ?? ""


export const allowedMethods:AllowedMethod[] = [
  {
    'Contract Address': USERNAME_CONTRACT,
    selector: 'claim_username'
  },
  {
    'Contract Address':USERNAME_CONTRACT,
    selector: 'change_username'
  },
  {
    'Contract Address': ART_PEACE_CONTRACT,
    selector: 'claim_today_quest'
  },
  {
    'Contract Address': ART_PEACE_CONTRACT,
    selector: 'claim_main_quest'
  },
  {
    'Contract Address': ART_PEACE_CONTRACT,
    selector: 'vote_color'
  },
  {
    'Contract Address': ART_PEACE_CONTRACT,
    selector: 'place_extra_pixels'
  },
  {
    'Contract Address': ART_PEACE_CONTRACT,
    selector: 'add_faction_template'
  },
  {
    'Contract Address':ART_PEACE_CONTRACT,
    selector: 'join_faction'
  },
  {
    'Contract Address': ART_PEACE_CONTRACT,
    selector: 'join_chain_faction'
  },
  {
    'Contract Address': ART_PEACE_CONTRACT,
    selector: 'add_chain_faction_template'
  },
  {
    'Contract Address': ART_PEACE_CONTRACT,
    selector: 'mint_nft'
  },
  {
    'Contract Address': CANVAS_NFT_CONTRACT_ADDRESS,
    selector: 'like_nft'
  },
  {
    'Contract Address': CANVAS_NFT_CONTRACT_ADDRESS,
    selector: 'unlike_nft'
  },
  {
    'Contract Address': ART_PEACE_CONTRACT,
    selector: 'increase_day_index'
  },
  {
    'Contract Address': ART_PEACE_CONTRACT,
    selector: 'place_pixel'
  }
];


// export const allowedMethods:AllowedMethod[] = [
//   {
//     "Contract Address": process.env.REACT_APP_USERNAME_STORE_CONTRACT_ADDRESS,
//     selector: 'claim_username'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_USERNAME_STORE_CONTRACT_ADDRESS,
//     selector: 'change_username'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
//     selector: 'claim_today_quest'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
//     selector: 'claim_main_quest'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
//     selector: 'vote_color'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
//     selector: 'place_extra_pixels'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
//     selector: 'add_faction_template'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
//     selector: 'join_faction'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
//     selector: 'join_chain_faction'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
//     selector: 'add_chain_faction_template'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
//     selector: 'mint_nft'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_CANVAS_NFT_CONTRACT_ADDRESS,
//     selector: 'like_nft'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_CANVAS_NFT_CONTRACT_ADDRESS,
//     selector: 'unlike_nft'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
//     selector: 'increase_day_index'
//   },
//   {
//     "Contract Address": process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
//     selector: 'place_pixel'
//   }
// ];

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
