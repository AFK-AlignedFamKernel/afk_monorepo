import React, { useEffect, useState } from 'react';
import { useStyles } from '../../hooks';
import stylesheet from './styles';
import { Chat } from '../../components/PrivateMessages/Chat';
import { App, AppRender } from "pixel_ui"
import WebView from 'react-native-webview';
import { Platform } from 'react-native';

export const PixelPeace: React.FC = () => {

  const styles = useStyles(stylesheet);


  return (
    <>

      {Platform.OS == "web"

        &&

        <>
          <iframe src={process.env.EXPO_PUBLIC_PIXEL_URL}
            height={"100%"}
            width={"100%"}
          ></iframe>

        </>
      }

      {Platform.OS != "web" &&
        <WebView
        >
          <AppRender></AppRender>
        </WebView>
      }

    </>

  );
};