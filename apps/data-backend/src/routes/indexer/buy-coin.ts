import express from "express";
import { prisma } from "indexer-prisma";

import { HTTPStatus } from "../../utils/http";

const Router = express.Router();

Router.get("/", async (req, res) => {
  try {
    const buyTokens = await prisma.token_transactions.findMany({
      where: { transaction_type: "buy" },
      select: {
        memecoin_address: true,
        price: true,
        total_supply: true,
        network: true
      }
    });

    res.status(HTTPStatus.OK).json({
      data: buyTokens
    });
  } catch (error) {
    console.error("Error fetching buy tokens:", error);
    res.status(HTTPStatus.InternalServerError).send("Internal Server Error");
  }
});

export default Router;
