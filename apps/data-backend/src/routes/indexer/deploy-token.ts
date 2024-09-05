import express from "express";
import { prisma } from "indexer-prisma";
import { HTTPStatus } from "../../utils/http";
import { isValidStarknetAddress } from "../../utils/starknet";

const Router = express.Router();

Router.get("/", async (req, res) => {
  try {
    // const deploys = await prisma.token_deploy.findMany({});

    // const data = deploys.map((item) => ({
    //   ...item,
    //   block_number: item.block_number ? Number(item.block_number) : null,
    //   cursor: item.cursor ? Number(item.cursor) : null
    // }));

    // res.status(HTTPStatus.OK).json({
    //   data: data
    // });

    const { tokenAddress } = req.params;
    if (!isValidStarknetAddress(tokenAddress)) {
      res
        .status(HTTPStatus.BadRequest)
        .send({ message: "Invalid token address" });
      return;
    }

    const distributions = await prisma.token_transactions.groupBy({
      by: ["owner_address"],
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
    console.error("Failed to fetch token deploys:", error);
    res.status(HTTPStatus.InternalServerError).send("Internal Server Error");
  }
});

Router.get("/:token", async (req, res) => {
  const { token } = req.params;
  if (!isValidStarknetAddress(token)) {
    res
      .status(HTTPStatus.BadRequest)
      .send({ message: "Invalid token address" });
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
