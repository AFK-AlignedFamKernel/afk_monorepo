import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BuyToken } from './interfaces';
import { CandlestickService } from '../candlestick/candlesticks.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BuyTokenService {
  private readonly logger = new Logger(BuyTokenService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly candlestickService: CandlestickService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.eventEmitter.on('candlestick.generate', async (data) => {
      await this.candlestickService.generateCandles(data.memecoinAddress);
    });
  }

  async create(data: BuyToken) {
    try {
      await this.prismaService.$transaction(async (prisma) => {
        const tokenLaunchRecord = await prisma.token_launch.findFirst({
          where: { memecoin_address: data.memecoinAddress },
          orderBy: { created_at: 'desc' },
        });

        let price = tokenLaunchRecord?.price ?? 0;

        const calculatedQuoteAmount = Number(data?.quoteAmount);

        if (!tokenLaunchRecord) {
          this.logger.warn(
            `Record with memecoin address ${data.memecoinAddress} doesn't exist`,
          );
          return;
        }

        let newSupply =
          Number(tokenLaunchRecord.current_supply ?? 0) - Number(data.amount);
        let newLiquidityRaised =
          Number(tokenLaunchRecord.liquidity_raised ?? 0) +
          calculatedQuoteAmount -
          Number(data?.protocolFee);

        if (newSupply < 0) {
          this.logger.warn(
            `Buy amount ${data.amount} would exceed remaining supply ${tokenLaunchRecord.current_supply}. Setting supply to 0.`,
          );
          newSupply = 0;
        }

        console.log('newLiquidityRaised', newLiquidityRaised);
        const maxLiquidityRaised = tokenLaunchRecord?.threshold_liquidity;

        if (Number(newLiquidityRaised) > Number(maxLiquidityRaised)) {
          newLiquidityRaised = Number(maxLiquidityRaised);
        }

        const newTotalTokenHolded =
          Number(tokenLaunchRecord.total_token_holded ?? 0) +
          Number(data.amount);

        // let price = Number(newTotalTokenHolded) / Number(newLiquidityRaised);

        // Calculate price based on liquidity and token supply
        // TODO better to do it with ETH per memecoin or Memecoin per ETH?
        //
        // Price = ETH liquidity / Fixed token supply in pool
        const initPoolSupply = Number(
          tokenLaunchRecord?.initial_pool_supply_dex,
        ); // Fixed memecoin supply
        const liquidityInQuoteToken = Number(newLiquidityRaised); // ETH liquidity that increases on buy, decreases on sell
        const tokensInPool = Number(initPoolSupply); // Fixed token supply
        // Memecoin per ETH
        const priceBuy =
          tokensInPool > 0 ? liquidityInQuoteToken / tokensInPool : 0;
        // ETH per Memecoin
        // let priceBuy = liquidityInQuoteToken > 0 && tokensInPool > 0 ? liquidityInQuoteToken / tokensInPool : 0;

        // if (priceBuy < 0) {
        //   priceBuy = 0;
        // }
        price = priceBuy;

        const marketCap = (
          (Number(tokenLaunchRecord.total_supply ?? 0) - newSupply) *
          price
        ).toString();

        console.log('price calculation', price);
        await this.prismaService.token_launch.update({
          where: { transaction_hash: tokenLaunchRecord.transaction_hash },
          data: {
            current_supply: newSupply.toString(),
            // liquidity_raised: {
            //   increment: Number(data.quoteAmount)
            // },
            liquidity_raised: newLiquidityRaised.toString(),
            total_token_holded: newTotalTokenHolded.toString(),
            price: price?.toString(),
            market_cap: marketCap,
          },
          // update: {
          //   current_supply: newSupply.toString(),
          //   liquidity_raised: newLiquidityRaised.toString(),
          //   total_token_holded: newTotalTokenHolded.toString(),
          //   price: price?.toString()
          // }
        });

        const sharesTokenUser = await prisma.shares_token_user.findUnique({
          where: {
            id: `${data.ownerAddress}_${data.memecoinAddress}`,
          },
        });

        let newAmountOwned = sharesTokenUser
          ? Number(sharesTokenUser.amount_owned) + Number(data.amount)
          : Number(data.amount);

        if (newAmountOwned > newTotalTokenHolded) {
          this.logger.warn(
            `Amount owned (${newAmountOwned}) exceeds total token held (${newTotalTokenHolded}). Adjusting amount owned to total token held.`,
          );
          newAmountOwned = newTotalTokenHolded;
        }

        await prisma.shares_token_user.upsert({
          where: {
            id: `${data.ownerAddress}_${data.memecoinAddress}`,
          },
          update: {
            amount_owned: newAmountOwned.toString(),
          },
          create: {
            id: `${data.ownerAddress}_${data.memecoinAddress}`,
            owner: data.ownerAddress,
            token_address: data.memecoinAddress,
            amount_owned: data.amount.toString(),
          },
        });

        await prisma.token_transactions.upsert({
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
            price: price?.toString(),
            amount: data.amount,
            protocol_fee: data.protocolFee,
            time_stamp: data.timestamp,
            transaction_type: data.transactionType,
          },
        });
      });

      this.eventEmitter.emit('candlestick.generate', {
        memecoinAddress: data.memecoinAddress,
        interval: 5,
      });
    } catch (error) {
      this.logger.error(
        `Error creating buy token record: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
