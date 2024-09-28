import React from 'react';
import {Dimensions, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';

// const tweetId = '20'; // Example Tweet ID

interface TwitterCardInterface {
  tweetId?: string;
}
const TwitterCard = ({tweetId}: TwitterCardInterface) => {
  const tweetHtml = `
    <html>
    <head>
      <meta name='viewport' content='width=device-width, initial-scale=1'>
      <script async src='https://platform.twitter.com/widgets.js' charset='utf-8'></script>
    </head>
    <body>
      <blockquote class="twitter-tweet">
        <a href="https://twitter.com/twitter/statuses/${tweetId ?? 0}"></a>
      </blockquote>
    </body>
    </html>`;

  return (
    <WebView
      originWhitelist={['*']}
      style={styles.container}
      source={{html: tweetHtml}}
      automaticallyAdjustContentInsets={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: Dimensions.get('window').width, // Adjust height accordingly
  },
});

export default TwitterCard;
