import express from 'express';
const { prisma } = require("indexer-prisma");
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';

const Router = express.Router();

Router.get('/token-distribution/:tokenAddress', async (req, res) => {
    const { tokenAddress } = req.params;

    if (!isValidStarknetAddress(tokenAddress)) {
        return res.status(HTTPStatus.BadRequest).json({
            error: "Invalid token address format."
        });
    }

    try {
        const distributions = await prisma.token_transactions.groupBy({
            by: ['owner_address'],
            where: { memecoin_address: tokenAddress },
            _sum: {
                amount: true
            },
            _count: {
                owner_address: true
            }
        });

        if (distributions.length === 0) {
            return res.status(HTTPStatus.NotFound).json({
                error: "No holders found for this token address."
            });
        }

        res.status(HTTPStatus.OK).json(distributions);
    } catch (error) {
        console.error("Failed to fetch token distribution:", error);
        res.status(HTTPStatus.InternalServerError).json({
            error: "Internal Server Error while fetching token distribution."
        });
    }
});

export default Router;
