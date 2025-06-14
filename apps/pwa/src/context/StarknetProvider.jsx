import { mainnet, sepolia } from '@starknet-react/chains';
import {
  argent,
  braavos,
  publicProvider,
  StarknetConfig,
  useInjectedConnectors,
  cartridgeProvider,
} from '@starknet-react/core';
import { voyager } from '@starknet-react/core';
import React from 'react';
import { availableConnectors, connectors } from '@/components/account/starknet/connectors';

const StarknetProvider = ({ children }) => {
  const chains = [mainnet, sepolia];
  // const provider = publicProvider();
  const provider = cartridgeProvider();
  // const {connectors} = useInjectedConnectors({
  //   recommended: [argent(), braavos()],
  //   includeRecommended: 'onlyIfNoConnectors',
  //   order: 'random',
  // });
  return (
    <StarknetConfig chains={chains}
      provider={provider}
      explorer={voyager}
      connectors={connectors}

    >
      {children}
    </StarknetConfig>
  );
};

export default StarknetProvider;
