import {Platform} from 'react-native';

import {
  ARGENT_APP_STORE_URL,
  ARGENT_APP_STORE_URL_FALLBACK,
  ARGENT_GOOGLE_PLAY_URL,
  ARGENT_GOOGLE_PLAY_URL_FALLBACK,
} from '../constants/urls';

export const getOperatingSystem = (): Platform['OS'] => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  if (/windows phone/i.test(userAgent)) {
    return 'windows';
  }

  if (/android/i.test(userAgent)) {
    return 'android';
  }

  // iOS detection from: http://stackoverflow.com/a/9039885/177710
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }

  return 'web';
};

export const getArgentAppStoreURL = () => {
  const mobilePlatform = Platform.OS;
  if (mobilePlatform === 'ios') return ARGENT_APP_STORE_URL;
  if (mobilePlatform === 'android') return ARGENT_GOOGLE_PLAY_URL;

  const webPlatform = getOperatingSystem();
  if (webPlatform === 'ios') return ARGENT_APP_STORE_URL_FALLBACK;
  if (webPlatform === 'android') return ARGENT_GOOGLE_PLAY_URL_FALLBACK;

  // Fallback to Google Play URL
  return ARGENT_GOOGLE_PLAY_URL_FALLBACK;
};

export const decimalsScale = (decimals: number) => `1${Array(decimals).fill('0').join('')}`;

export const shortenPubkey = (pubkey?: string, length = 6) =>
  pubkey ? `${pubkey.slice(0, length)}...${pubkey.slice(-length)}` : undefined;

export const dataURLToBlob = (dataURL: string) => {
  const byteString = atob(dataURL.split(',')[1]);
  const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];

  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);

  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ab], {type: mimeString});
};

export const getImageRatio = (width: number, height: number, minRatio = 0.75, maxRatio = 1.5) => {
  return Math.max(minRatio, Math.min(maxRatio, width / height));
};

export function removeHashFn(str: string) {
  return str?.replace(/#/g, '');
}

export const getRelativeTime = (date: string | number | Date) => {
  const now = new Date();
  const timestamp = new Date(date);
  const secondsAgo = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

  // Handle invalid dates
  if (isNaN(secondsAgo)) {
    return 'Invalid date';
  }

  // Define time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1,
  };

  // Handle future dates
  if (secondsAgo < 0) {
    return 'in the future';
  }

  // Less than a minute
  if (secondsAgo < 60) {
    return 'just now';
  }

  // Check each interval
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(secondsAgo / secondsInUnit);

    if (interval >= 1) {
      return interval === 1 ? `about ${interval} ${unit} ago` : `about ${interval} ${unit}s ago`;
    }
  }

  return 'just now';
};

export const formatCurrency = (value: number, currency: string): string => {
  if (currency === 'sat') {
    return formatSat(value, 'sat');
  }
  if (currency === 'msat') {
    return formatSat(value, 'msat');
  }
  let newValue = value;
  if (currency === 'usd' || currency === 'eur') {
    newValue = value / 100;
  }

  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
  }).format(newValue);
};

export const formatSat = (value: number, currencyString: string) => {
  return new Intl.NumberFormat('en').format(value) + ` ${currencyString}`;
};

export const generateNonce = {
  randomString: (length = 17) => {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  },
};

export function truncateAddress(address: string, startChars = 4, endChars = 4) {
  if (!address) return '';

  const prefix = address.startsWith('0x') ? '0x' : '';
  const cleanAddr = address.startsWith('0x') ? address.slice(2) : address;

  if (cleanAddr.length <= startChars + endChars) {
    return address;
  }

  const start = prefix + cleanAddr.slice(0, startChars);
  const end = cleanAddr.slice(-endChars);

  return `${start}...${end}`;
}
