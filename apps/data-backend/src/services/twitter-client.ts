import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

export const getTwitterClient = (accessToken: string, accessSecret: string) => {
  return new TwitterApi({
    appKey: process.env.TWITTER_API_KEY!,
    appSecret: process.env.TWITTER_API_SECRET_KEY!,
    accessToken,
    accessSecret,
  });
};



export const getRequestToken = async () => {
  const response = await axios.post(
    'https://api.twitter.com/oauth/request_token',
    null,
    {
      headers: {
        Authorization: `OAuth oauth_consumer_key="${process.env.TWITTER_API_KEY!}", oauth_signature="${process.env.TWITTER_API_SECRET_KEY!}&"`,
      },
    }
  );

  const params = new URLSearchParams(response.data);
  return {
    oauthToken: params.get('oauth_token'),
    oauthTokenSecret: params.get('oauth_token_secret'),
  };
};
