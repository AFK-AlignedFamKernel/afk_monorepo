import type { FastifyInstance } from 'fastify';
import dotenv from 'dotenv';
import { scrapeGoogleSearch, scrapeGoogleTrends, getOverallTrends } from '../../services/scraper/trends/googleTrends';
dotenv.config();

async function trendsRoutes(fastify: FastifyInstance) {
    // Check if the plugin is already registered

    fastify.get('/analytics/keyword', async (req, reply) => {
        const keyword = (req.query as any).keyword;
        console.log("query", req.query);
        if (!keyword) return reply.code(400).send({ error: 'Keyword is required' });

        const [results, trends] = await Promise.all([
            scrapeGoogleSearch(keyword),
            scrapeGoogleTrends(keyword),
        ]);

        return {
            keyword,
            topPages: results,
            googleTrends: {
                trendValues: trends.trendValues,
                relatedQueries: trends.relatedQueries,
                overallTrend: trends.overallTrend
            }
        };
    });

    fastify.get('/analytics/trends', async (req, reply) => {
        try {
            const trends = await getOverallTrends();
            return trends;
        } catch (error) {
            console.error('Error fetching overall trends:', error);
            return reply.code(500).send({ error: 'Failed to fetch trends data' });
        }
    });
}

export default trendsRoutes;
