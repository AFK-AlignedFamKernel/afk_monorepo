import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BuyToken } from './interfaces';

@Injectable()
export class BuyTokenService {
  private readonly logger = new Logger(BuyTokenService.name);
  constructor(private readonly prismaService: PrismaService) { }

  async create(data: BuyToken) {
    try {
      const tokenLaunchRecord = await this.prismaService.token_launch.findFirst(
        { where: { memecoin_address: data.memecoinAddress } },
      );

      let price = tokenLaunchRecord?.price ?? 0;

      if (!tokenLaunchRecord) {
        this.logger.warn(
          `Record with memecoin address ${data.memecoinAddress} doesn't exists`,
        );
      } else {
        const newSupply =
          Number(tokenLaunchRecord.current_supply ?? 0) - Number(data.amount);
        let newLiquidityRaised =
          Number(tokenLaunchRecord.liquidity_raised ?? 0) +
          Number(data.quoteAmount);

        newLiquidityRaised = newLiquidityRaised - Number(data?.protocolFee);

        console.log("newLiquidityRaised", newLiquidityRaised);
        const maxLiquidityRaised = tokenLaunchRecord?.threshold_liquidity;

        if (Number(newLiquidityRaised) > Number(maxLiquidityRaised)) {
          newLiquidityRaised = Number(maxLiquidityRaised);
        }

        const newTotalTokenHolded =
          Number(tokenLaunchRecord.total_token_holded ?? 0) +
          Number(data.amount);

        // let price = Number(newTotalTokenHolded) / Number(newLiquidityRaised);

        // Calculate price based on liquidity and token supply
        // Price = Liquidity in ETH / Total tokens in pool
        const initPoolSupply = Number(tokenLaunchRecord?.initial_pool_supply_dex ?? 0);
        const liquidityInQuoteToken= Number(newLiquidityRaised);
        // const tokensInPool = Number(newTotalTokenHolded);
        const tokensInPool = Number(initPoolSupply);
        // Avoid division by zero
        let priceBuy = tokensInPool > 0 ? tokensInPool / liquidityInQuoteToken : 0; // Price in memecoin per ETH

        // if (priceBuy < 0) {
        //   priceBuy = 0;
        // }
        price = priceBuy;

        console.log("price calculation", price);
        await this.prismaService.token_launch.update({
          where: { transaction_hash: tokenLaunchRecord.transaction_hash },
          data: {
            current_supply: newSupply.toString(),
            // liquidity_raised: {
            //   increment: Number(data.quoteAmount)
            // },
            liquidity_raised: newLiquidityRaised.toString(),
            total_token_holded: newTotalTokenHolded.toString(),
            price: price?.toString()
          },
          // update: {
          //   current_supply: newSupply.toString(),
          //   liquidity_raised: newLiquidityRaised.toString(),
          //   total_token_holded: newTotalTokenHolded.toString(),
          //   price: price?.toString()
          // }
        });
      }

      await this.prismaService.shares_token_user.upsert({
        where: {
          id: `${data.ownerAddress}_${data.memecoinAddress}`,
          owner: data.ownerAddress,
          token_address: data.memecoinAddress,
        },
        update: {
          amount_owned: {
            increment: data.amount,
          },
        },
        create: {
          id: `${data.ownerAddress}_${data.memecoinAddress}`,
          owner: data.ownerAddress,
          token_address: data.memecoinAddress,
          amount_owned: data.amount,
        },
      });

      await this.prismaService.token_transactions.upsert({
        where: { transfer_id: data.transferId },
        update: {},
        create: {
          transfer_id: data.transferId,
          network: data.network,
          block_hash: data.blockHash,
          block_number: data.blockNumber,
          block_timestamp: data.blockTimestamp,
          transaction_hash: data.transactionHash,
          memecoin_address: data.memecoinAddress,
          owner_address: data.ownerAddress,
          last_price: data.lastPrice,
          quote_amount: data.quoteAmount,
          price: price?.toString() ?? data.price,
          amount: data.amount,
          protocol_fee: data.protocolFee,
          time_stamp: data.timestamp,
          transaction_type: data.transactionType,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error creating buy token record: ${error.message}`,
        error.stack,
      );
    }
  }
}
