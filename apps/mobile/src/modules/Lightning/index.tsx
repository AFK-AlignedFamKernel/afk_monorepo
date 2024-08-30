import '../../../applyGlobalPolyfills';

import { init, launchModal, requestProvider } from '@getalby/bitcoin-connect-react';
import { LightningAddress } from '@getalby/lightning-tools';
import { webln } from '@getalby/sdk';
import React, { useRef } from 'react';
import { Platform, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import PolyfillCrypto from 'react-native-webview-crypto';

import { WebLNProvider } from '@webbtc/webln-types';

import { Button, Input } from '../../components';
import { useStyles } from '../../hooks';
import stylesheet from './styles';
export const LightningNetworkWalletView: React.FC = () => {
  const styles = useStyles(stylesheet);
  return (
    // <SafeAreaView style={styles.safeArea}>
    <ScrollView>

      <PolyfillCrypto />

      <LightningNetworkWallet />

    </ScrollView>

    // </SafeAreaView>

  );
};

function LightningNetworkWallet() {


  const styles = useStyles(stylesheet);
  const [amountSats, setAmountSats] = React.useState<string | undefined>("1")

  const [nwcUrl, setNwcUrl] = React.useState('');
  const [pendingNwcUrl, setPendingNwcUrl] = React.useState('');
  const [nwcAuthUrl, setNwcAuthUrl] = React.useState('');
  const [paymentRequest, setPaymentRequest] = React.useState('');
  const [preimage, setPreimage] = React.useState('');
  const [nostrWebLN, setNostrWebLN] = React.useState<webln.NostrWebLNProvider | undefined>(
    undefined,
  );
  const webviewRef = useRef<WebView>(null);

  const onMessage = (event: WebViewMessageEvent) => {
    const { data } = event.nativeEvent;
    console.log('Received message from WebView:', data);

    // Handle messages sent from the WebView, e.g., invoice payment status
  };

  const injectJavaScript = `
  (async function() {
    if (window.webln) {
      try {
        await window.webln.enable();
        const invoice = await window.webln.makeInvoice({ amount: 1000, memo: "React Native Zap" });
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "invoice", data: invoice }));
      } catch (error) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: error.message }));
      }
    } else {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: "WebLN not available" }));
    }
  })();
`;

  const [balance, setBalance] = React.useState<number | undefined>();
  React.useEffect(() => {
    // Initialize Bitcoin Connect
    init({
      appName: 'AFK Lightning App', // your app name
      filters: ['nwc'],
      showBalance: true,
      providerConfig: {
        nwc: {
          authorizationUrlOptions: {
            requestMethods: ['get_balance', 'make_invoice', 'lookup_invoice'],
          },
        },
      },
    });
    if (!nwcUrl) {
      return;
    }
    (async () => {
      try {
        const _nostrWebLN = new webln.NostrWebLNProvider({
          nostrWalletConnectUrl: nwcUrl,
        });
        setNostrWebLN(_nostrWebLN);
        await _nostrWebLN.enable();
        const response = await _nostrWebLN.getBalance();
        console.log('Balance response', response);
        setBalance(response.balance);
      } catch (error) {
        console.error(error);
      }
    })();

    (async () => {
      try {
        const lightningAddress = new LightningAddress('hello@getalby.com');
        await lightningAddress.fetch();
        const invoice = await lightningAddress.requestInvoice({
          satoshi: 1,
        });
        setPaymentRequest(invoice.paymentRequest);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [nwcUrl]);

  async function payInvoice() {
    try {
      if (!nostrWebLN) {
        throw new Error('No WebLN provider');
      }
      const result = await nostrWebLN.sendPayment(paymentRequest);
      setPreimage(result.preimage);
    } catch (error) {
      console.error(error);
    }
  }

  async function connectWithAlby() {
    const nwc = webln.NostrWebLNProvider.withNewSecret({
      //authorizationUrl: "http://192.168.1.102:8080",
      // authorizationUrl:nwcAuthUrl
    });
    console.log('nwc', nwc);

    const authUrl = nwc.client.getAuthorizationUrl({
      name: 'React Native NWC demo',
    });
    setPendingNwcUrl(nwc.client.getNostrWalletConnectUrl(true));
    setNwcAuthUrl(authUrl.toString());
    console.log('auth url', authUrl);
    console.log(
      'nwc.client.getNostrWalletConnectUrl(true)',
      nwc.client.getNostrWalletConnectUrl(true),
    );
  }

  // if (nwcAuthUrl) {
  //   return Platform.OS == 'web' ? (
  //     <iframe src={nwcAuthUrl} height="250" width="100%" />
  //   ) : (
  //     <WebView
  //       source={{ uri: nwcAuthUrl }}
  //       javaScriptEnabled={true}
  //       injectedJavaScriptBeforeContentLoaded={`
  //         // TODO: remove once NWC also posts messages to the window
  //         window.opener = window;
  //         // Listen for window messages
  //         window.addEventListener("message", (event) => {
  //           window.ReactNativeWebView.postMessage(event.data?.type);
  //         });
  //       `}
  //       onMessage={(event) => {
  //         if (event.nativeEvent.data === 'nwc:success') {
  //           setNwcAuthUrl('');
  //           setNwcUrl(pendingNwcUrl);
  //         }
  //       }}
  //     />
  //   );
  // }

  const handleRequest = async () => {
    let modal = launchModal();
    const provider = await requestProvider();
    // let send_payment = await provider.sendPayment('lnbc...');
    return;
  };

  return (
    <ScrollView>

      {/* <View>
        {
          Platform.OS == "web" ?
            <iframe src={nwcAuthUrl} height="250" width="100%"

            />
            :
            <WebView
              ref={webviewRef}
              source={{ uri: nwcAuthUrl ?? 'https://example.com' }} // Your Lightning wallet-enabled web page
              onMessage={onMessage}
              injectedJavaScript={injectJavaScript}
              javaScriptEnabled={true}
              originWhitelist={['*']}
            />
        }
      </View> */}

      <ScrollView style={{ marginVertical: 5 }}>
        {
          Platform.OS == 'web' ? (
            <>
              <iframe src={nwcAuthUrl} height="350" width="100%"
              />

              <a href={nwcAuthUrl} target='_blank'>Go to</a>
            </>

          ) : (
            <WebView
              source={{ uri: nwcAuthUrl }}
              javaScriptEnabled={true}
              injectedJavaScriptBeforeContentLoaded={`
              // TODO: remove once NWC also posts messages to the window
              window.opener = window;
              // Listen for window messages
              window.addEventListener("message", (event) => {
                window.ReactNativeWebView.postMessage(event.data?.type);
              });
            `}
              onMessage={(event) => {
                if (event.nativeEvent.data === 'nwc:success') {
                  setNwcAuthUrl('');
                  setNwcUrl(pendingNwcUrl);
                }
              }}
            />
          )
        }
      </ScrollView>

      <ScrollView style={{ marginVertical: 5 }}>
        <Text style={styles.text}>Paste NWC URL</Text>
        <TextInput
          onChangeText={(text) => setNwcUrl(text)}
          style={{
            borderWidth: 1,
            padding: 10,
            margin: 10,
          }}
        />

        <Text style={styles.text}>or</Text>
        <Button onPress={connectWithAlby}>
          <Text>Connect with Alby NWC</Text>
        </Button>
      </ScrollView>

      <View
        style={{ marginVertical: 5 }}
      // style={{ margin: 5 }}
      >
        <Button onPress={handleRequest}>
          <Text>Handle</Text>
        </Button>
      </View>
      {nwcUrl && (
        <>
          <Text style={styles.text}>Balance</Text>
          <Text style={styles.text}>{balance ?? 'Loading...'}</Text>
          <Text style={styles.text}>Pay an invoice</Text>
          <Text style={styles.text}>{paymentRequest ?? 'Loading...'}</Text>
          {paymentRequest && (

            <View>
              <Input
                keyboardType='numeric'
                value={amountSats}
                onChangeText={setAmountSats}
                placeholder="Amount Sats" />

              <Button onPress={payInvoice}>
                <Text>Pay invoice ({amountSats} sats)</Text>
              </Button>
            </View>

          )}
          <Text style={styles.text}>{preimage ? `PAID: ${preimage}` : 'Not paid yet'}</Text>
        </>
      )}
    </ScrollView>
  );
}
