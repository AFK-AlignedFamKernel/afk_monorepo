import axios from 'axios';
import { load } from 'cheerio';

interface KeywordMetrics {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  trend: number;
  relatedKeywords: Array<{
    keyword: string;
    searchVolume: number;
    cpc: number;
    competition: number;
  }>;
  questions: string[];
  longTailKeywords: string[];
}

export async function getKeywordToolData(keyword: string): Promise<KeywordMetrics> {
  try {
    const response = await axios.get(
      `https://keywordtool.io/search/keywords/${encodeURIComponent(keyword)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      }
    );

    const $ = load(response.data);
    const metrics: KeywordMetrics = {
      keyword,
      searchVolume: 0,
      cpc: 0,
      competition: 0,
      trend: 0,
      relatedKeywords: [],
      questions: [],
      longTailKeywords: []
    };

    // Parse main keyword metrics
    $('div[data-testid="keyword-metrics"]').each((_, element) => {
      metrics.searchVolume = parseInt($(element).find('[data-testid="search-volume"]').text()) || 0;
      metrics.cpc = parseFloat($(element).find('[data-testid="cpc"]').text()) || 0;
      metrics.competition = parseFloat($(element).find('[data-testid="competition"]').text()) || 0;
      metrics.trend = parseInt($(element).find('[data-testid="trend"]').text()) || 0;
    });

    // Parse related keywords
    $('div[data-testid="related-keywords"] tr').each((_, element) => {
      const keyword = $(element).find('td:nth-child(1)').text().trim();
      const searchVolume = parseInt($(element).find('td:nth-child(2)').text()) || 0;
      const cpc = parseFloat($(element).find('td:nth-child(3)').text()) || 0;
      const competition = parseFloat($(element).find('td:nth-child(4)').text()) || 0;

      if (keyword) {
        metrics.relatedKeywords.push({
          keyword,
          searchVolume,
          cpc,
          competition
        });
      }
    });

    // Parse questions
    $('div[data-testid="questions"] li').each((_, element) => {
      const question = $(element).text().trim();
      if (question) {
        metrics.questions.push(question);
      }
    });

    // Parse long-tail keywords
    $('div[data-testid="long-tail-keywords"] li').each((_, element) => {
      const longTail = $(element).text().trim();
      if (longTail) {
        metrics.longTailKeywords.push(longTail);
      }
    });

    return metrics;
  } catch (error) {
    console.error('Error fetching KeywordTool data:', error);
    return {
      keyword,
      searchVolume: 0,
      cpc: 0,
      competition: 0,
      trend: 0,
      relatedKeywords: [],
      questions: [],
      longTailKeywords: []
    };
  }
} 