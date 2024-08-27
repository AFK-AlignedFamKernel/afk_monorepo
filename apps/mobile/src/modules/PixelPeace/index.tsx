import React, { useEffect, useState } from 'react';
import { useStyles } from '../../hooks';
import stylesheet from './styles';
import { Chat } from '../../components/PrivateMessages/Chat';
import { App } from "pixel_ui"
import WebView from 'react-native-webview';
import { Platform } from 'react-native';

export const PixelPeace: React.FC = () => {

  const styles = useStyles(stylesheet);


  if (Platform.OS == "web") {
    return (
      <>
        <WebView
          originWhitelist={['*']}
          injectedJavaScript={<App></App>}
        // source={{ html: "<iFrame src='your_URL' />" }} 
        />

      </>


    )
  }

  return (
    <>
      <WebView>

      </WebView>

    </>

  );
};