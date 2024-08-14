import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';

interface EmbedWebsiteInterface {
    uri?: string
}
const EmbedWebsite = ({ uri }: EmbedWebsiteInterface) => {

    const isWeb = Platform.OS == "web"

    if (isWeb) {
        return <iframe src={uri}
            height={"100%"}
        ></iframe>
    }
    return (
        <View style={styles.container}>
            <WebView
                source={{ uri: uri ?? 'https://example.com' }} // Replace 'https://example.com' with your desired URL
                style={{ flex: 1 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default EmbedWebsite;
