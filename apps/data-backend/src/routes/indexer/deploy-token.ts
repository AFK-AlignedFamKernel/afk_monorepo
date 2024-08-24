import express from 'express';
import { prisma } from "indexer-prisma";
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';

const Router = express.Router();

Router.get('/', async (req, res) => {
    try {
        const deploys = await prisma.token_deploy.findMany({});
        res.status(HTTPStatus.OK).json({
            data: deploys
        });
    } catch (error) {
        console.error("Failed to fetch token deploys:", error);
        res.status(HTTPStatus.InternalServerError).send("Internal Server Error");
    }
});

Router.get('/:token', async (req, res) => {
    const { token } = req.params;
    if (!isValidStarknetAddress(token)) {
        res.status(HTTPStatus.BadRequest).send({ message: 'Invalid token address' });
        return;
    }

    try {
        const tokenData = await prisma.token_deploy.findMany({
            where: { memecoin_address: token }
        });
        res.status(HTTPStatus.OK).json({
            data: tokenData
        });
    } catch (error) {
        console.error("Error fetching token by address:", error);
        res.status(HTTPStatus.InternalServerError).send("Internal Server Error");
    }
});

export default Router;
