import axios from 'axios';

import {BACKEND_URL, INDEXER_BACKEND_URL} from '../constants/env';

export const ApiInstance = axios.create({
  baseURL: BACKEND_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const ApiIndexerInstance = axios.create({
  baseURL: INDEXER_BACKEND_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    // 'Access-Control-Allow-Origin':'*'
  },
});

