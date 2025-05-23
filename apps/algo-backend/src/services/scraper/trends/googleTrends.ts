import axios from 'axios';
import cheerio from 'cheerio';
import { load } from 'cheerio';

interface TrendValue {
    date: string;
    value: number;
}

interface GeographicalData {
    country: string;
    value: number;
}

interface TrendData {
    trendValues: TrendValue[];
    relatedQueries: string[];
    overallTrend: number;
    geographicalData: GeographicalData[];
}

interface OverallTrends {
    dailyTrends: Array<{
        title: string;
        traffic: string;
        articles: Array<{
            title: string;
            url: string;
            source: string;
        }>;
    }>;
    realtimeTrends: Array<{
        title: string;
        traffic: string;
        articles: Array<{
            title: string;
            url: string;
            source: string;
        }>;
    }>;
}

async function getTrendsToken(): Promise<string> {
    try {
        const response = await axios.get('https://trends.google.com/trends/explore', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        const $ = cheerio.load(response.data);
        const token = $('script').text().match(/token:\s*'([^']+)'/)?.[1];
        console.log("token", token);
        return token || 'APP6_UEAAAAAX7QZQzQYwQzQYwQzQYwQzQYwQzQYwQz';
    } catch (error) {
        console.error('Error getting trends token:', error);
        return 'APP6_UEAAAAAX7QZQzQYwQzQYwQzQYwQzQYwQzQYwQz';
    }
}

export async function scrapeGoogleTrends(keyword: string): Promise<TrendData> {
    try {
        const response = await axios.get(
            `https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}&date=today%201-m&geo=`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            }
        );

        const $ = load(response.data);
        const trendValues: TrendValue[] = [];
        const relatedQueries: string[] = [];
        const geographicalData: GeographicalData[] = [];

        // Parse trend values
        $('div[data-testid="trends-chart"]').find('path').each((_, element) => {
            const date = $(element).attr('data-date');
            const value = parseInt($(element).attr('data-value') || '0');
            if (date && value) {
                trendValues.push({ date, value });
            }
        });

        // Parse related queries
        $('div[data-testid="related-queries"]').find('a').each((_, element) => {
            const query = $(element).text().trim();
            if (query) {
                relatedQueries.push(query);
            }
        });

        // Parse geographical data
        $('div[data-testid="geo-chart"]').find('path').each((_, element) => {
            const country = $(element).attr('data-country');
            const value = parseInt($(element).attr('data-value') || '0');
            if (country && value) {
                geographicalData.push({ country, value });
            }
        });

        // Calculate overall trend
        const overallTrend = trendValues.reduce((sum, trend) => sum + trend.value, 0) / trendValues.length;

        return {
            trendValues,
            relatedQueries,
            overallTrend,
            geographicalData
        };
    } catch (error) {
        console.error('Error scraping Google Trends:', error);
        return {
            trendValues: [],
            relatedQueries: [],
            overallTrend: 0,
            geographicalData: []
        };
    }
}

export async function scrapeGoogleSearch(keyword: string): Promise<any[]> {
    try {
        const response = await axios.get(
            `https://www.google.com/search?q=${encodeURIComponent(keyword)}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            }
        );

        const $ = load(response.data);
        const results: any[] = [];

        $('div.g').each((_, element) => {
            const title = $(element).find('h3').text();
            const link = $(element).find('a').attr('href');
            const snippet = $(element).find('div.VwiC3b').text();

            if (title && link) {
                results.push({ title, link, snippet });
            }
        });

        return results;
    } catch (error) {
        console.error('Error scraping Google Search:', error);
        return [];
    }
}

export async function getOverallTrends(): Promise<any> {
    try {
        const response = await axios.get('https://trends.google.com/trends/trendingsearches/daily', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = load(response.data);
        const trends: any[] = [];

        $('div[data-testid="trending-item"]').each((_, element) => {
            const title = $(element).find('h3').text();
            const volume = $(element).find('div[data-testid="trending-volume"]').text();
            const related = $(element).find('div[data-testid="related-queries"]').text();

            if (title) {
                trends.push({ title, volume, related });
            }
        });

        return trends;
    } catch (error) {
        console.error('Error getting overall trends:', error);
        return [];
    }
}
