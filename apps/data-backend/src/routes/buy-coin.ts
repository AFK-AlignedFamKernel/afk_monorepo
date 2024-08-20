import express from 'express'
import prisma from 'indexer-prisma';
import { HTTPStatus } from '../utils/http';

const Router = express.Router()

Router.get('/', async (req, res) => {
  try {
    const buy_token = await prisma.buy_token.findMany({})
    console.log("buy_token", buy_token)
    res.status(HTTPStatus.OK).json({
      data: buy_token
    })
  } catch (error) {
    res.status(HTTPStatus.InternalServerError).send(error)
  }
})


export default Router
