import React, {useState} from 'react';
import {View, Button, Text, StyleSheet} from 'react-native';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_INDEXER_BACKEND_URL ?? 'http://localhost:3000'; // Replace with your Fastify backend URL

const TwitterOauth = ({navigation}: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [screenName, setScreenName] = useState<string | null>(null);

  const initiateOAuth = async () => {
    try {
      const {data} = await axios.get(`${API_URL}/auth/login`);
      navigation.navigate('OAuthWebView', {authUrl: data.url});
    } catch (error) {
      console.error('Failed to start OAuth:', error);
    }
  };

  const postTweet = async () => {
    try {
      const {data} = await axios.post(`${API_URL}/tweet`, {
        tweetContent: 'Hello from React Native!',
      });
      alert('Tweet posted successfully: ' + data.tweet.text);
    } catch (error) {
      console.error('Failed to post tweet:', error);
      alert('Failed to post tweet');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Twitter OAuth Example</Text>
      {!isAuthenticated ? (
        <Button title="Connect to Twitter" onPress={initiateOAuth} />
      ) : (
        <View>
          <Text style={styles.welcome}>Welcome, {screenName}</Text>
          <Button title="Post a Tweet" onPress={postTweet} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 20, marginBottom: 20},
  welcome: {marginBottom: 20, fontSize: 16},
});

export default TwitterOauth;
