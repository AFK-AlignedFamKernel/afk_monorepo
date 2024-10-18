// OnrampMoney.ts
import '../../../../applyGlobalPolyfills';
import { View, Text, Platform } from 'react-native';
import WebView from 'react-native-webview';
import { ScrollView } from 'react-native-gesture-handler';
import PolyfillCrypto from 'react-native-webview-crypto';

export function OnrampMoney() {
    enum Action {
        Buy,
        Sell,
        Swap
    }

    const base = `https://onramp.money/app/?appId=`
    const appId = `${process.env.EXPO_PUBLIC_APP_ID_ONRAMP_MONEY}&walletAddress=`
    const renderOnrampView = () => {
        if (Platform.OS === 'web') {
            return (
                <iframe
                    src={`${base}${appId}`}
                    height={"100%"}
                    width="100%"
                >
                </iframe>

            );
        } else if (WebView) {
            return (
                <WebView
                    source={{ uri:`${base}${appId}` }}
                    injectedJavaScriptBeforeContentLoaded={`
                window.opener = window;
                window.addEventListener("message", (event) => {
                  window.ReactNativeWebView.postMessage(event.data?.type);
                });
              `}
                    onMessage={(event) => {

                    }}
                />
            );
        }
        return null;
    };

    return (
        <ScrollView>
            <PolyfillCrypto></PolyfillCrypto>

            <View style={{ height: 600 }}>
                {renderOnrampView()}


            </View>




        </ScrollView >

    );
}
