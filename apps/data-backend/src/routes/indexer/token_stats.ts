import express from 'express';
const { prisma } = require("indexer-prisma");
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';

const Router = express.Router();

// Endpoint to get the latest statistics for a specific token address
Router.get('/stats/:tokenAddress', async (req, res) => {
    const { tokenAddress } = req.params;

    if (!isValidStarknetAddress(tokenAddress)) {
        return res.status(HTTPStatus.BadRequest).json({
            error: "Invalid token address format."
        });
    }

    try {
        // Query the latest price and liquidity raised
        const stats = await prisma.token_transactions.findFirst({
            where: { memecoin_address: tokenAddress },
            orderBy: { created_at: 'desc' },
            select: {
                price: true,
                liquidity_raised: true
            }
        });

        if (stats) {
            res.status(HTTPStatus.OK).json(stats);
        } else {
            res.status(HTTPStatus.NotFound).json({
                error: "No data found for the specified token address."
            });
        }
    } catch (error) {
        res.status(HTTPStatus.InternalServerError).json({
            error: "Internal Server Error while fetching statistics."
        });
    }
});

export default Router;
