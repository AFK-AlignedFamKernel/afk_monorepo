import puppeteer from 'puppeteer';
import cheerio from 'cheerio';

export async function scrapeKeywordTool(keyword: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const url = `https://keywordtool.io/search/google/${encodeURIComponent(keyword.replace(/\s+/g, '-'))}?language=en`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const content = await page.content();
  await browser.close();

  const $ = cheerio.load(content);

  const results: any[] = [];

  $('table tbody tr').each((_, el) => {
    const cells = $(el).find('td');
    const kw = $(cells[0]).text().trim();
    const volume = $(cells[1]).text().trim();
    const cpc = $(cells[2]).text().trim();
    const comp = $(cells[3]).text().trim();

    if (kw && volume) {
      results.push({ keyword: kw, volume, cpc, competition: comp });
    }
  });

  return {
    source: 'keywordtool.io',
    inputKeyword: keyword,
    data: results.slice(0, 5),
  };
}
