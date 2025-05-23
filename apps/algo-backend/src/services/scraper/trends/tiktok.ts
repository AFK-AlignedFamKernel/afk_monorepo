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
  