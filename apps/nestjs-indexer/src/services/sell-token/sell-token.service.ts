import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SellToken } from './interfaces';
import { CandlestickService } from '../candlestick/candlesticks.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SellTokenService {
  private readonly logger = new Logger(SellTokenService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly candlestickService: CandlestickService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.eventEmitter.on('candlestick.generate', async (data) => {
      await this.candlestickService.generateCandles(
        data.memecoinAddress,
        data.interval,
      );
    });
  }

  async create(data: SellToken) {

    console.log('sell token data', data);
    try {
      const sellTokenRecord =
        await this.prismaService.token_transactions.findUnique({
          where: { transfer_id: data.transferId },
        });

      if (sellTokenRecord) {
        this.logger.warn(
          `Record with transfer ID ${data.transferId} already exists`,
        );
        return;
      }

      const tokenLaunchRecord = await this.prismaService.token_launch.findFirst(
        { where: { memecoin_address: data.memecoinAddress } },
      );

      let price = tokenLaunchRecord?.price ?? 0;

      let coinAmount = Number(data.coinAmount);
      let quoteAmount = Number(data.amount);

      // const calculatedQuoteAmount = Number(data.amount) * Number(price);
      const calculatedQuoteAmount = Number(data.quoteAmount);

      const effectiveQuoteAmount =
        calculatedQuoteAmount;
      // calculatedQuoteAmount - Number(data?.protocolFee);

      if (!tokenLaunchRecord) {
        this.logger.warn(
          `Record with memecoin address ${data.memecoinAddress} doesn't exists`,
        );
      } else {
        const newSupply =
          Number(tokenLaunchRecord.current_supply ?? 0) + Number(data.coinAmount);
        let newLiquidityRaised =
          Number(tokenLaunchRecord.liquidity_raised ?? 0) -
          effectiveQuoteAmount;

        const maxLiquidityRaised = tokenLaunchRecord?.threshold_liquidity;

        if (Number(newLiquidityRaised) > Number(maxLiquidityRaised)) {
          newLiquidityRaised = Number(maxLiquidityRaised);
        }
        // TODO fix issue negative number
        // Check event fees etc
        if (newLiquidityRaised < 0) {
          newLiquidityRaised = 0;
        }
        // TODO fix issue negative number
        // Check event fees etc
        let newTotalTokenHolded =
          Number(tokenLaunchRecord.total_token_holded ?? 0) -
          Number(data.coinAmount);

        // Ensure total token held does not go below zero
        if (newTotalTokenHolded < 0) {
          newTotalTokenHolded = 0;
        }

        const initPoolSupply = Number(
          tokenLaunchRecord?.initial_pool_supply_dex ?? 0,
        );
        const liquidityInQuoteToken = Number(newLiquidityRaised);
        // const tokensInPool = Number(newTotalTokenHolded);
        const tokensInPool = Number(initPoolSupply);
        // Avoid division by zero
        // Memecoin per ETH
        const priceAfterSell =
          tokensInPool > 0 ? liquidityInQuoteToken / tokensInPool : 0; // Price in memecoin per ETH
        // ETH per Memecoin
        // let priceAfterSell = liquidityInQuoteToken > 0 && tokensInPool > 0 ? liquidityInQuoteToken / tokensInPool : 0;

        // if (priceHere < 0) {
        //   priceHere = 0;
        // }
        price = priceAfterSell;
        console.log('price calculation', price);

        // const marketCap = (
        //   (Number(tokenLaunchRecord.total_supply ?? 0) - newSupply) *
        //   price
        // ).toString();

        const marketCap = (
          (Number(tokenLaunchRecord.total_supply ?? 0)) *
          price
        ).toString();

        await this.prismaService.token_launch.update({
          where: { transaction_hash: tokenLaunchRecord.transaction_hash },
          data: {
            current_supply: newSupply.toString(),
            liquidity_raised: newLiquidityRaised.toString(),
            total_token_holded: newTotalTokenHolded.toString(),
            price: price?.toString(),
            market_cap: marketCap,
          },
        });
      }

      // TODO check share user fixed negative number after total sell for first time
      await this.prismaService.shares_token_user.upsert({
        where: {
          id: `${data.ownerAddress}_${data.memecoinAddress}`,
          owner: data.ownerAddress,
          token_address: data.memecoinAddress,
        },
        update: {
          amount_owned: {
            // decrement: data.amount,
            decrement: data?.coinAmount,
          },
          // amount_owned: {
          //   // decrement: data.amount,
          //   decrement: data.coinAmount ?? data?.amount,
          // },
        },
        create: {
          id: `${data.ownerAddress}_${data.memecoinAddress}`,
          owner: data.ownerAddress,
          token_address: data.memecoinAddress,
          amount_owned: data.coinAmount.toString(),
        },
      });
      // await this.prismaService.shares_token_user.upsert({
      //   where: {
      //     id: `${data.ownerAddress}_${data.memecoinAddress}`,
      //     owner: data.ownerAddress,
      //     token_address: data.memecoinAddress,
      //   },
      //   update: {
      //     amount_owned: {
      //       // decrement: data.amount,
      //       decrement: data.coinAmount ?? data?.amount,
      //     },
      //     // amount_owned: {
      //     //   // decrement: data.amount,
      //     //   decrement: data.coinAmount ?? data?.amount,
      //     // },
      //   },
      //   create: {
      //     id: `${data.ownerAddress}_${data.memecoinAddress}`,
      //     owner: data.ownerAddress,
      //     token_address: data.memecoinAddress,
      //     amount_owned: data.amount,
      //   },
      // });

      await this.prismaService.token_transactions.create({
        data: {
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
          price: price?.toString(),
          amount: data.amount,
          protocol_fee: data.protocolFee,
          time_stamp: data.timestamp,
          transaction_type: data.transactionType,
        },
      });

      this.eventEmitter.emit('candlestick.generate', {
        memecoinAddress: data.memecoinAddress,
        interval: 60,
      });
    } catch (error) {
      this.logger.error(
        `Error creating buy token record: ${error.message}`,
        error.stack,
      );
    }
  }
}
