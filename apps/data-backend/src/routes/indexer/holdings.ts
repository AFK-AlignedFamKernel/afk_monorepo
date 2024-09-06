import express from "express";
import { prisma } from "indexer-prisma";
import { HTTPStatus } from "../../utils/http";
import { isValidStarknetAddress } from "../../utils/starknet";

const Router = express.Router();

Router.get("/:tokenAddress", async (req, res) => {
  const tokenAddress = req.params.tokenAddress;

  if (!isValidStarknetAddress(tokenAddress)) {
    res.status(HTTPStatus.BadRequest).send({
      message: "Invalid token address format."
    });
    return;
  }

  try {
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

    const formattedDistributions = distributions.map((entry) => {
      const amountBigInt = Number(entry._sum.amount).toLocaleString();

      return {
        ...entry,
        _sum: {
          amount: amountBigInt
        }
      };
    });

    if (distributions.length === 0) {
      res.status(HTTPStatus.NotFound).send({
        meesage: "No holders found for this token address."
      });
    }

    res.status(HTTPStatus.OK).json({ data: formattedDistributions });
  } catch (error) {
    console.error("Failed to fetch token distribution:", error);
    res.status(HTTPStatus.InternalServerError).send({
      message: "Internal Server Error while fetching token distribution."
    });
  }
});

export default Router;
