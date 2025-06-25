import {getAuthData, storeAuthData} from '../utils/storage';
import {ApiIndexerInstance} from './api';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const refreshTokens = async (): Promise<AuthTokens> => {
  try {
    const oldData = await getAuthData();
    if (!oldData) {
      throw new Error('No refresh token available');
    }

    const response = await ApiIndexerInstance.post('/refresh-token', {
      refreshToken: oldData.refreshToken,
    });

    const newTokens: AuthTokens = response.data?.data;

    await storeAuthData({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      tokenType: oldData.tokenType,
      user: oldData.user,
    });

    return newTokens;
  } catch (error) {
    // If refresh fails, clear tokens and redirect to login
    console.log(error, 'err');
    throw error;
  }
};
