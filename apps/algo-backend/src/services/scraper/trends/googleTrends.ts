import axios from 'axios';
import cheerio from 'cheerio';

interface TrendData {
    keyword: string;
    trendValues: number[];
    relatedQueries: string[];
    overallTrend: number;
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
        const token = await getTrendsToken();

        // Get interest over time
        const interestResponse = await axios.get(
            `https://trends.google.com/trends/explore?q=${keyword}`,
            //   {
            //     headers: {
            //       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            //       'Accept': 'application/json, text/plain, */*',
            //       'Accept-Language': 'en-US,en;q=0.9',
            //       'Referer': 'https://trends.google.com/',
            //     }
            //   }
        );

        // Get related queries
        const relatedResponse = await axios.get(
            `https://trends.google.com/trends/explore?q=${keyword}`,

            //   `https://trends.google.com/trends/api/widgetdata/relatedsearches?hl=en-US&tz=-120&req={"restriction":{"geo":{},"time":"today 12-m","complexKeywordsRestriction":{"keyword":[{"type":"BROAD","value":${JSON.stringify(keyword)}}]}},"keywordType":"QUERY","metric":["TOP","RISING"],"trendinessSettings":{"compareTime":"today 12-m"},"language":"en","searchTerms":[${JSON.stringify(keyword)}]}&token=${token}&tz=-120`,
            //   {
            //     headers: {
            //       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            //       'Accept': 'application/json, text/plain, */*',
            //       'Accept-Language': 'en-US,en;q=0.9',
            //       'Referer': 'https://trends.google.com/',
            //     }
            //   }
        );

        let trendValues: number[] = [];
        let relatedQueries: string[] = [];

        // Process interest over time data if response is successful
        if (interestResponse.status === 200 && interestResponse.data) {
            try {
                const interestJsonStr = interestResponse.data.replace(')]}\',', '');
                const interestData = JSON.parse(interestJsonStr);

                if (interestData?.widgets?.[0]?.timeSeriesData?.[0]?.value) {
                    trendValues = interestData.widgets[0].timeSeriesData[0].value.map((value: number) => Math.round(value));
                }
            } catch (e) {
                console.error('Error processing interest data:', e);
            }
        }

        // Process related queries data if response is successful
        if (relatedResponse.status === 200 && relatedResponse.data) {
            try {
                const relatedJsonStr = relatedResponse.data.replace(')]}\',', '');
                const relatedData = JSON.parse(relatedJsonStr);

                if (relatedData?.widgets?.[0]?.rankedList?.[0]?.rankedKeyword) {
                    relatedQueries = relatedData.widgets[0].rankedList[0].rankedKeyword
                        .map((item: any) => item.query)
                        .slice(0, 5);
                }
            } catch (e) {
                console.error('Error processing related queries data:', e);
            }
        }

        // Calculate overall trend if we have trend values
        const overallTrend = trendValues.length > 0
            ? Math.round(trendValues.reduce((sum: number, value: number) => sum + value, 0) / trendValues.length)
            : 0;

        return {
            keyword,
            trendValues: trendValues.length > 0 ? trendValues : [0],
            relatedQueries: relatedQueries.length > 0 ? relatedQueries : ['No related queries found'],
            overallTrend
        };
    } catch (error) {
        console.error('Error fetching Google Trends data:', error);
        return {
            keyword,
            trendValues: [0],
            relatedQueries: ['No related queries found'],
            overallTrend: 0
        };
    }
}

export async function scrapeGoogleSearch(keyword: string): Promise<string[]> {
    try {
        const response = await axios.get(
            `https://www.google.com/search?q=${encodeURIComponent(keyword)}&hl=en`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            }
        );

        const $ = cheerio.load(response.data);
        const links = $('a')
            .map((_, el) => $(el).attr('href'))
            .get()
            .filter(href =>
                href &&
                href.startsWith('http') &&
                !href.includes('google') &&
                !href.includes('/search')
            );

        return [...new Set(links)].slice(0, 10); // Top 10 deduplicated
    } catch (error) {
        console.error('Error fetching Google Search results:', error);
        return [];
    }
}

export async function getOverallTrends(): Promise<OverallTrends> {
    try {
        const token = await getTrendsToken();

        // Get daily trends
        const dailyResponse = await axios.get(
            `https://trends.google.com/trends/api/dailytrends?hl=en-US&tz=-120&geo=US&ns=15&token=${token}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://trends.google.com/',
                }
            }
        );

        // Get realtime trends
        const realtimeResponse = await axios.get(
            `https://trends.google.com/trends/api/realtimetrends?hl=en-US&tz=-120&geo=US&ns=15&token=${token}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://trends.google.com/',
                }
            }
        );

        // Process daily trends
        const dailyJsonStr = dailyResponse.data.replace(')]}\',', '');
        const dailyData = JSON.parse(dailyJsonStr);
        const dailyTrends = dailyData.default.trendingSearchesDays[0].trendingSearches.map((item: any) => ({
            title: item.title.query,
            traffic: item.formattedTraffic,
            articles: item.articles.map((article: any) => ({
                title: article.title,
                url: article.url,
                source: article.source
            }))
        }));

        // Process realtime trends
        const realtimeJsonStr = realtimeResponse.data.replace(')]}\',', '');
        const realtimeData = JSON.parse(realtimeJsonStr);
        const realtimeTrends = realtimeData.storySummaries.trendingStories.map((item: any) => ({
            title: item.title,
            traffic: item.formattedTraffic,
            articles: item.articles.map((article: any) => ({
                title: article.title,
                url: article.url,
                source: article.source
            }))
        }));

        return {
            dailyTrends: dailyTrends.slice(0, 10), // Top 10 daily trends
            realtimeTrends: realtimeTrends.slice(0, 10) // Top 10 realtime trends
        };
    } catch (error) {
        console.error('Error fetching overall trends:', error);
        // Return placeholder data in case of error
        return {
            dailyTrends: [
                {
                    title: 'Sample Daily Trend',
                    traffic: '100K+',
                    articles: [{
                        title: 'Sample Article',
                        url: 'https://example.com',
                        source: 'Example News'
                    }]
                }
            ],
            realtimeTrends: [
                {
                    title: 'Sample Realtime Trend',
                    traffic: '50K+',
                    articles: [{
                        title: 'Sample Article',
                        url: 'https://example.com',
                        source: 'Example News'
                    }]
                }
            ]
        };
    }
}
