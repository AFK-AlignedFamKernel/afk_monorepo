import axios, {AxiosError, AxiosInstance, AxiosRequestConfig} from 'axios';


export const ApiInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_DATA_BACKEND_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ApiIndexerInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_INDEXER_BACKEND_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    // 'Access-Control-Allow-Origin':'*'
  },
});

export const ApiBackendInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    // 'Access-Control-Allow-Origin':'*'
  },
});



export function createAxiosInstanceWithInterceptor(baseURL: string): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 10_000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add token to every request
  instance.interceptors.request.use(
    async (config) => {
      // const oldData = await getAuthData();
      // if (oldData?.accessToken) {!
      //   config.headers['Authorization'] = `Bearer ${oldData.accessToken}`;
      // }
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor to handle token refresh
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & {_retry?: boolean};

      // Check if the error is due to an unauthorized access and we haven't already tried to refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh tokens
          // const newTokens = await refreshTokens();

          // // Update the original request with the new access token
          // if (originalRequest.headers) {
          //   originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`;
          // }

          // Retry the original request
          return instance(originalRequest);
        } catch (refreshError) {
          // If token refresh fails, return the original error
          return Promise.reject(refreshError);
        }
      }

      // For all other errors, reject the promise
      return Promise.reject(error);
    },
  );

  return instance;
}
