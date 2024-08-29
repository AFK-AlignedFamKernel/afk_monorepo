import {mainnet, sepolia} from '@starknet-react/chains';
import {
  argent,
  braavos,
  publicProvider,
  StarknetConfig,
  useInjectedConnectors,
} from '@starknet-react/core';
import {voyager} from '@starknet-react/core';
import React from 'react';

const StarknetProvider = ({children}) => {
  const chains = [mainnet, sepolia];
  const provider = publicProvider();
  const {connectors} = useInjectedConnectors({
    recommended: [argent(), braavos()],
    includeRecommended: 'onlyIfNoConnectors',
    order: 'random',
  });

  return (
    <StarknetConfig chains={chains} provider={provider} explorer={voyager} connectors={connectors}>
      {children}
    </StarknetConfig>
  );
};

export default StarknetProvider;
