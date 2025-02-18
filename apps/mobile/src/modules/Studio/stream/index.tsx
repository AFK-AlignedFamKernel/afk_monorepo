import {StatusBar} from 'expo-status-bar';
import React, {useEffect, useState} from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';

import {IWebStreamProps, WebStreamCompositionComponent} from './webStream';

export interface IProps {
  toggleChat: () => void;
}
export default function StreamCompositionComponent({
  toggleChat,
  isStreamer,
  socketRef,
  streamKey,
  streamerUserId,
  recordingUrl,
}: IWebStreamProps) {
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        // const cameraPermission = await Camera.requestPermissionsAsync();
        // const audioPermission = await Audio.requestPermissionsAsync();
        // const libraryPermission = await MediaLibrary.requestPermissionsAsync();
        // setHasPermission(
        //   cameraPermission.status === 'granted' &&
        //     audioPermission.status === 'granted'&&
        //     libraryPermission.status === 'granted',
        // );
        return;
      } else {
        setHasPermission(true);
      }
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera, audio, or media library</Text>;
  }

  if (Platform.OS === 'web') {
    return (
      <WebStreamCompositionComponent
        streamerUserId={streamerUserId}
        socketRef={socketRef}
        streamKey={streamKey}
        isStreamer={isStreamer}
        recordingUrl={recordingUrl}
        toggleChat={toggleChat}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>This feature is not supported on mobile devices.</Text>
      <Text style={styles.text}>Please use a web browser for full functionality.</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
});
