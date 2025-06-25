import {constants, shortString} from 'starknet';

export const typedDataValidate = {
    types: {
      StarkNetDomain: [
        {name: 'name', type: 'felt'},
        {name: 'version', type: 'felt'},
        {name: 'chainId', type: 'felt'},
        {name: 'uri', type: 'felt'},
      ],
      Message: [
        {name: 'address', type: 'felt'},
        {name: 'statement', type: 'felt'},
        {name: 'nonce', type: 'felt'},
        {name: 'issuedAt', type: 'felt'},
      ],
    },
    primaryType: 'Message',
    domain: {
      name: 'AFk',
      version: '0.0.5',
      chainId: shortString.encodeShortString(process.env.EXPO_PUBLIC_NETWORK || 'SN_MAIN'),
      uri: 'https://afk-community.xyz/',
    },
    message: {
      address: '',
      statement: 'I love Afk!',
      nonce: generateNonce.randomString(),
      issuedAt: new Date().toISOString(),
    },
  };
  