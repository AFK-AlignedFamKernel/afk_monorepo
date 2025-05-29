import type { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
import { scrapeGoogleSearch, scrapeGoogleTrends, getOverallTrends } from '../../services/scraper/trends/googleTrends';
import { searchTikTok, getTikTokAnalytics } from '../../services/scraper/tiktok';
import { getUnifiedTrendAnalytics } from '../../services/analytics/trendAnalytics';
import { getHistoricalAnalytics } from '../../services/analytics/historicalAnalytics';
import { scrapeKeywordTool } from '../../services/scraper/trends/keywordtoolio';
// import { runPythonScript } from '../../utils/pythonRunner';
dotenv.config();

async function trendsRoutes(fastify: FastifyInstance) {

    // fastify.get('/analytics/trends', async (req, reply) => {
    //     try {
    //         // const trends = await getOverallTrends();
    //         const result = await runPythonScript('google_trends.py', {
    //             keyword: 'AI ethics',
    //             timeframe: 'today 5-y',
    //             geo: 'US'
    //           });
    //           if (result.status === 'success') {
    //             console.log('Trends data:', result.processed_data);
    //           } else {
    //             console.error('Error:', result.error);
    //           }
              
    //         return reply.code(200).send(result);
    //     } catch (error) {
    //         console.error('Error fetching overall trends:', error);
    //         return reply.code(500).send({ error: 'Failed to fetch trends data' });
    //     }
    // });
    fastify.get('/trend-per-top-pages', async (req, reply) => {
        try {
            const keyword = (req.query as any).keyword;
            if (!keyword) return reply.code(400).send({ error: 'Keyword is required' });

            const data = await scrapeKeywordTool(keyword);
            console.log("data", data);

            return reply.code(200).send(data)   ;   
        } catch (error) {
            console.error('Error fetching keyword data:', error);
            return reply.code(500).send({ error: 'Failed to fetch keyword data' });
        }
    });

    fastify.get('/analytics/keywordtool', async (req, reply) => {
           
        try {
            const keyword = (req.query as any).keyword;
            if (!keyword) return reply.code(400).send({ error: 'Keyword is required' });

            const data = await scrapeKeywordTool(keyword);
            console.log("data", data);

            return reply.code(200).send(data)   ;   
        } catch (error) {
            console.error('Error fetching keyword data:', error);
            return reply.code(500).send({ error: 'Failed to fetch keyword data' });
        }
    });
    // Check if the plugin is already registered

    fastify.get('/analytics/keyword', async (req, reply) => {

        try {
            const keyword = (req.query as any).keyword;
            console.log("query", req.query);
            if (!keyword) return reply.code(400).send({ error: 'Keyword is required' });
    
            const [results, trends] = await Promise.all([
                scrapeGoogleSearch(keyword),
                scrapeGoogleTrends(keyword),
            ]);
    
            return reply.code(200).send({
                keyword,
                topPages: results,
                googleTrends: {
                    trendValues: trends.trendValues,
                    relatedQueries: trends.relatedQueries,
                    overallTrend: trends.overallTrend
                }
            });   
        } catch (error) {
            console.error('Error fetching keyword data:', error);
            return reply.code(500).send({ error: 'Failed to fetch keyword data' });
        }
    });

    fastify.get('/analytics/trends', async (req, reply) => {
        try {
            const trends = await getOverallTrends();
            return reply.code(200).send(trends);
        } catch (error) {
            console.error('Error fetching overall trends:', error);
            return reply.code(500).send({ error: 'Failed to fetch trends data' });
        }
    });

    fastify.get('/analytics/tiktok', async (req, reply) => {
        const keyword = (req.query as any).keyword;
        if (!keyword) return reply.code(400).send({ error: 'Keyword is required' });

        try {
            const [videos, analytics] = await Promise.all([
                searchTikTok(keyword),
                getTikTokAnalytics(keyword)
            ]);

            return reply.code(200).send({
                keyword,
                videos,
                analytics
            });
        } catch (error) {
            console.error('Error fetching TikTok data:', error);
            return reply.code(500).send({ error: 'Failed to fetch TikTok data' });
        }
    });

    fastify.get('/analytics/unified', async (req, reply) => {
        const keyword = (req.query as any).keyword;
        if (!keyword) return reply.code(400).send({ error: 'Keyword is required' });

        try {
            const analytics = await getUnifiedTrendAnalytics(keyword);
            return reply.code(200).send(analytics);
        } catch (error) {
            console.error('Error fetching unified analytics:', error);
            return reply.code(500).send({ error: 'Failed to fetch unified analytics data' });
        }
    });

    fastify.get('/analytics/historical', async (req, reply) => {
        const keyword = (req.query as any).keyword;
        const days = parseInt((req.query as any).days || '30');
        
        if (!keyword) return reply.code(400).send({ error: 'Keyword is required' });
        if (isNaN(days) || days < 1 || days > 365) {
            return reply.code(400).send({ error: 'Days must be between 1 and 365' });
        }

        try {
            const analytics = await getHistoricalAnalytics(keyword, days);
            return reply.code(200).send(analytics)  ;
        } catch (error) {
            console.error('Error fetching historical analytics:', error);
            return reply.code(500).send({ error: 'Failed to fetch historical analytics data' });
        }
    });
}

export default trendsRoutes;
