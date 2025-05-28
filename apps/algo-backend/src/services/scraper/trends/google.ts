// src/googleTrends.ts
import axios from 'axios';

export async function fetchGoogleTrends(keyword: string) {
  const url = `https://trends.google.com/trends/api/explore`;
  // You can use an unofficial wrapper or scrape `trends.google.com` using puppeteer
  const response = await axios.get(`https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&q=${keyword}`);
  return response.data;
}
