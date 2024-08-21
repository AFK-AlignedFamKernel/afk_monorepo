const { prisma } = require("indexer-prisma");

import express from 'express'
import { HTTPStatus } from '../../utils/http';
import { isValidStarknetAddress } from '../../utils/starknet';

const Router = express.Router()

Router.get('/', async (req, res) => {
    try {
        const deploys = await prisma.token_deploy.findMany({})
        console.log("deploys",deploys)
        res.status(HTTPStatus.OK).json({
            data: deploys
        })
    } catch (error) {
        res.status(HTTPStatus.InternalServerError).send(error)
    }
})


Router.get('/:token', async (req, res) => {
    try {
        const { token } = req.params
        if (!isValidStarknetAddress(token)) {
            res.status(HTTPStatus.BadRequest).send({ code: HTTPStatus.BadRequest, message: 'Invalid token address' })
            return
        }
        const tokenData = await prisma.token_deploy.findMany({where:{
            memecoin_address:token
        }})
        res.status(HTTPStatus.OK).json({
            data: tokenData
        })
    } catch (error) {
        res.status(HTTPStatus.InternalServerError).send(error)
    }
})


export default Router
