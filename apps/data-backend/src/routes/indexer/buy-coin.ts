import express from 'express'
// import prisma from 'indexer-prisma';
const { prisma } = require("indexer-prisma");

import { HTTPStatus } from '../../utils/http';

const Router = express.Router()

Router.get('/', async (req, res) => {
  try {
    const buyTokens = await prisma.token_transactions.findMany({
      where: { transaction_type: 'buy' }
    });
    console.log("Fetched Buy Tokens:", buyTokens);
    res.status(HTTPStatus.OK).json({
      data: buyTokens
    });
  } catch (error) {
    console.error("Error fetching buy tokens:", error);
    res.status(HTTPStatus.InternalServerError).send("Internal Server Error");
  }
});


export default Router
