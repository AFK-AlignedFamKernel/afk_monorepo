import express from 'express';
const { prisma } = require("indexer-prisma");
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';

const Router = express.Router();

Router.get('/my-share/:tokenAddress/:userId', async (req, res) => {
    const { tokenAddress, userId } = req.params;

    if (!isValidStarknetAddress(tokenAddress)) {
        return res.status(HTTPStatus.BadRequest).json({
            error: "Invalid token address format."
        });
    }

    try {
        const transactions = await prisma.token_transactions.findMany({
            where: {
                memecoin_address: tokenAddress,
                owner_address: userId
            },
            select: {
                transaction_type: true,
                amount: true
            }
        });

        if (transactions.length === 0) {
            return res.status(HTTPStatus.NotFound).json({
                error: "No transactions found for this user and token address."
            });
        }

        const result = transactions.reduce((acc, cur) => {
            acc.total += parseFloat(cur.amount || 0);
            if (cur.transaction_type === 'buy') {
                acc.buy += parseFloat(cur.amount || 0);
            } else if (cur.transaction_type === 'sell') {
                acc.sell += parseFloat(cur.amount || 0);
            }
            return acc;
        }, { total: 0, buy: 0, sell: 0 });

        res.status(HTTPStatus.OK).json(result);
    } catch (error) {
        console.error("Failed to retrieve user transactions:", error);
        res.status(HTTPStatus.InternalServerError).json({
            error: "Internal Server Error while fetching user transactions."
        });
    }
});

export default Router;
