import React from 'react';
import {Platform, View} from 'react-native';
import WebView from 'react-native-webview';
import {useStyles} from '../../hooks';
import {useIsDesktop} from '../../hooks/useIsDesktop';
import stylesheet from './styles';
// import {AppPixelComponent} from 'pixel_component';
export const PixelPeace: React.FC = () => {
  const styles = useStyles(stylesheet);
  const isDesktop = useIsDesktop();

  return (
    <View style={{height: '100%'}}>
      {Platform.OS == 'web' && (
        // && process.env.EXPO_PUBLIC_PIXEL_URL
        <>
            {/* <AppPixelComponent
              // artPeaceAddress={ART_PEACE_ADDRESS['0x534e5f5345504f4c4941']}
              // nftCanvasAddress={}
              // usernameAddress={USERNAME_STORE_ADDRESS['0x534e5f5345504f4c4941']}
            ></AppPixelComponent> */}
          <iframe
            src={process.env.EXPO_PUBLIC_PIXEL_URL}
            // height={isDesktop ? 750 : 550}
            height={550}
            width="100%"
          ></iframe>
        </>
      )}

      {/* {Platform.OS != 'web' && process.env.EXPO_PUBLIC_PIXEL_URL && (
        <WebView source={{uri: process.env.EXPO_PUBLIC_PIXEL_URL}}></WebView>
      )} */}
    </View>
  );
};
