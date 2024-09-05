import express from "express";
import { prisma } from "indexer-prisma";

import { HTTPStatus } from "../../utils/http";

const Router = express.Router();

Router.get("/", async (req, res) => {
  try {
    const buyTokens = await prisma.token_transactions.findMany({
      where: { transaction_type: "buy" }
    });

    const data = buyTokens.map((item) => ({
      ...item,
      block_number: item.block_number ? Number(item.block_number) : null,
      cursor: item.cursor ? Number(item.cursor) : null
    }));

    res.status(HTTPStatus.OK).json({
      data: data
    });
  } catch (error) {
    console.error("Error fetching buy tokens:", error);
    res.status(HTTPStatus.InternalServerError).send("Internal Server Error");
  }
});

export default Router;
