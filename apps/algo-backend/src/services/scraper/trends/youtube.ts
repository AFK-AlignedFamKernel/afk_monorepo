// src/youtube.ts
import puppeteer from 'puppeteer';

export async function getYoutubeSearchSuggestions(query: string): Promise<string[]> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://www.youtube.com/results?search_query=${query}`);

  const suggestions = await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('#video-title'));
    return titles.map(el => el.textContent?.trim() ?? '').slice(0, 10);
  });

  await browser.close();
  return suggestions;
}
