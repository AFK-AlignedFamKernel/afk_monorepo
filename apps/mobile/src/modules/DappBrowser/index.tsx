import React from 'react';
import { WebView } from 'react-native-webview';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
// import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { ethers, parseEther } from 'ethers';
import { useAuth } from 'afk_nostr_sdk';
import { Platform } from 'react-native';

// This component will handle the dApp interaction
const DAppBrowser = () => {
  const { address, isConnected, chain, chainId } = useAccount();
  const { evmPublicKey, evmPrivateKey } = useAuth()
  const { connect } = useConnect({
    // connector: new MetaMaskConnector(),
  });
  const { disconnect } = useDisconnect();

  // Example of viem client setup
  const client = new ethers.JsonRpcProvider(process?.env?.EXPO_PUBLIC_PROVIDER_URL ?? "https://mainnet.infura.io/v3/YOUR_INFURA_KEY");

  // Generate the injection script for the dApp to use the wallet
  const injectWalletScript = (address: string | undefined, chainId: number | undefined) => `
    (function() {
      window.ethereum = {
        isMetaMask: true,
        selectedAddress: '${address}',
        chainId: '${chainId}',

        enable: () => Promise.resolve([ '${address}' ]),

        request: async ({ method, params }) => {
          if (method === 'eth_requestAccounts') {
            return ['${address}'];
          }
          if (method === 'eth_chainId') {
            return '${chainId}';
          }
          if (method === 'eth_sendTransaction') {
            const transaction = params[0];
            return await window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'sendTransaction',
              transaction: transaction
            }));
          }
          if (method === 'eth_sign') {
            const [address, message] = params;
            return await window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'signMessage',
              address,
              message
            }));
          }
        }
      };
    })();
  `;

  // Handle messages from the WebView (e.g., transaction requests)
  const handleOnMessage = async (event: { nativeEvent: { data: string; }; }) => {
    const message = JSON.parse(event.nativeEvent.data);
    if (message.type === 'sendTransaction') {
      // Process transaction using viem or ethers.js
      console.log('Transaction:', message.transaction);
      // Example: send transaction via ethers.js
      //   client.sendTransaction({
      //     from: message.transaction.from,
      //     to: message.transaction.to,
      //     value: parseEther(message.transaction.value),
      //     gasLimit: message.transaction.gas,
      //     data: message.transaction.data,
      //   });

      if (evmPrivateKey) {
        const wallet = new ethers.Wallet(evmPrivateKey, client);
        const tx = await wallet.sendTransaction({
          from: message.transaction.from,
          to: message.transaction.to,
          value: parseEther(message.transaction.value),
          gasLimit: message.transaction.gas,
          data: message.transaction.data,
        });
      }

      //   wallet.se(message.message).then(signedMessage => {
      //     // Send back the signed message to WebView
      //     console.log('Signed Message:', signedMessage);
      //   });
    } else if (message.type === 'signMessage') {
      console.log('Message to sign:', message.message);
      // Sign message with ethers.js
      if (evmPrivateKey) {
        const wallet = new ethers.Wallet(evmPrivateKey, client);
        wallet.signMessage(message.message).then(signedMessage => {
          // Send back the signed message to WebView
          console.log('Signed Message:', signedMessage);
        });
      }

    }
  };

  // If connected, inject the wallet
  const injectedScript = isConnected ? injectWalletScript(address, chain?.id) : '';

  return (
    <>
      {
        Platform.OS == "web" ?

          <>
            <iframe
              id={"dappIframe"}
              src={'https://lfg.afk-community.xyz' } // The dApp URL
              // injectedJavaScript={injectedScript}
              // onMessage={handleOnMessage} // Handle WebView messages
            />
          </>

          :
          <>
            <WebView
              source={{ uri: 'https://example-dapp.com' }} // The dApp URL
              injectedJavaScript={injectedScript}
              onMessage={handleOnMessage} // Handle WebView messages
            />
          </>

      }
    </>



  );
};

export default DAppBrowser;
