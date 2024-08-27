import express from 'express';
const { prisma } = require("indexer-prisma");
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';

const Router = express.Router();

Router.get('/candles/:tokenAddress', async (req, res) => {
    const { tokenAddress } = req.params;

    if (!isValidStarknetAddress(tokenAddress)) {
        return res.status(HTTPStatus.BadRequest).json({
            error: "Invalid token address format."
        });
    }
    
    try {
        const transactions = await prisma.token_transactions.findMany({
            where: { memecoin_address: tokenAddress },
            orderBy: { block_timestamp: 'asc' },
            select: {
                price: true,
                block_timestamp: true,
                transaction_type: true
            }
        });

        if (transactions.length === 0) {
            return res.status(HTTPStatus.NotFound).json({
                error: "No transactions found for this token address."
            });
        }
        // Hourly candles
        const candles = transactions.reduce((acc, { block_timestamp, price }) => {
            const hour = block_timestamp.getHours();
            if (!acc[hour]) {
                acc[hour] = { open: price, high: price, low: price, close: price };
            } else {
                acc[hour].high = Math.max(acc[hour].high, price);
                acc[hour].low = Math.min(acc[hour].low, price);
                acc[hour].close = price;
            }
            return acc;
        }, {});

        res.status(HTTPStatus.OK).json(candles);
    } catch (error) {
        res.status(HTTPStatus.InternalServerError).json({
            error: "Internal Server Error while generating candles."
        });
    }
});

export default Router;