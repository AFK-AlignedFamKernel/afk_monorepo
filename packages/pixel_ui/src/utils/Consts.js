import backendConfig from '../configs/backend.config.json';

/** TODO fix url */
// TODO used REACT_APP_NODE_ENV

// export const backendUrl = 'https://' + backendConfig.host;
export const backendUrl =  backendConfig.host;
// export const backendUrl = 'https://' + backendConfig.host + ':' + backendConfig.port;

// export const backendUrl = backendConfig.production
//   ? 'https://' + backendConfig.host
//   : 'http://' + backendConfig.host + ':' + backendConfig.port;

export const wsUrl = backendConfig.production
  ? 'wss://' + backendConfig.host + '/ws'
  : 'ws://' + backendConfig.host + ':' + backendConfig.consumer_port + '/ws';

export const nftUrl = backendConfig.production
  ? 'https://' + backendConfig.host
  : 'http://' + backendConfig.host + ':' + backendConfig.consumer_port;

export const templateUrl = backendConfig.production
  ? 'https://' + backendConfig.host
  : 'http://' + backendConfig.host + ':' + backendConfig.port;

// TODO used REACT_APP_NODE_ENV
export const devnetMode = backendConfig.production === false;
export const convertUrl = (url) => {
  if (!url) {
    return url;
  }
  return url.replace('$BACKEND_URL', backendUrl);
};
