import { DynamicContextProvider, DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

const DynamicProvider: React.FC<React.PropsWithChildren> = ({children}) => (
  <DynamicContextProvider
    settings={{
      environmentId: process.env.EXPO_PUBLIC_DYNAMIC_API_KEY ?? "",
      walletConnectors: [ EthereumWalletConnectors ],
    }}>
    <DynamicWidget />
    {children}
  </DynamicContextProvider>
);

export default DynamicProvider;
