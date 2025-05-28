import puppeteer from 'puppeteer';

export async function scrapeTiktokTrends(keyword: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://www.tiktok.com/search?q=${keyword}`);

  const data = await page.evaluate(() => {
    const elements = document.querySelectorAll('div[data-e2e="search-video-item"]');
    return Array.from(elements).map(el => {
      const text = el.textContent || '';
      return text.slice(0, 100); // preview
    });
  });

  await browser.close();
  return data;
}

export async function scrapeTiktokTrendingTags() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('https://www.tiktok.com/explore', {
    waitUntil: 'domcontentloaded',
  });

  // Wait for hashtag elements to appear
  await page.waitForSelector('[data-e2e="trending-hashtag-card"]', { timeout: 10000 });

  const data = await page.evaluate(() => {
    const cards = document.querySelectorAll('[data-e2e="trending-hashtag-card"]');
    return Array.from(cards).map(card => {
      const title = card.querySelector('[data-e2e="trending-hashtag-title"]')?.textContent?.trim() || '';
      const views = card.querySelector('[data-e2e="trending-hashtag-view-count"]')?.textContent?.trim() || '';
      return { title, views };
    });
  });

  await browser.close();
  return data;
}
