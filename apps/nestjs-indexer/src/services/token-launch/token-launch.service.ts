import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenLaunch } from './interfaces';

@Injectable()
export class TokenLaunchService {
  private readonly logger = new Logger(TokenLaunchService.name);
  constructor(private readonly prismaService: PrismaService) {}

  async create(data: TokenLaunch) {
    try {
      const tokenLaunchRecord =
        await this.prismaService.token_launch.findUnique({
          where: { transaction_hash: data.transactionHash },
        });

      if (tokenLaunchRecord) {
        this.logger.warn(
          `Record with transaction hash ${data.transactionHash} already exists`,
        );
        return;
      }

      const bondingType =
        data.bondingType === '0'
          ? 'Linear'
          : data.bondingType === '1'
            ? 'Exponential'
            : null;

      // TODO: add this in the event
      const initalPoolSupply = Number(data.totalSupply) / 5;
      const initPoolSupply = Number(initalPoolSupply ?? 0);
      const liquidityInQuoteToken = Number(0);
      const tokensInPool = Number(initPoolSupply);
      // Avoid division by zero
      let priceBuy =
        tokensInPool > 0 ? tokensInPool / liquidityInQuoteToken : 0; // Price in memecoin per ETH
      if (priceBuy < 0) {
        priceBuy = 0;
      }

      let deployToken = await this.prismaService.token_deploy.findFirst({
        where: { memecoin_address: data.memecoinAddress },
      });

      if (!deployToken) {
        this.logger.error(
          `Deploy token with address ${data.memecoinAddress} not found`,
        );
        return;
      }
      await this.prismaService.token_launch.create({
        data: {
          network: data.network,
          block_hash: data.blockHash,
          block_number: data.blockNumber,
          block_timestamp: data.blockTimestamp,
          transaction_hash: data.transactionHash,
          memecoin_address: data.memecoinAddress,
          quote_token: data.quoteToken,
          price: priceBuy?.toString() ?? data.price,
          total_supply: data.totalSupply,
          current_supply: data.totalSupply,
          is_liquidity_added: false,
          liquidity_raised: '0',
          threshold_liquidity: data.thresholdLiquidity,
          owner_address: data.ownerAddress,
          bonding_type: bondingType,
          initial_pool_supply_dex: initPoolSupply?.toString(),
          market_cap: '0',
          token_deploy: {
            connect: {
              transaction_hash: deployToken.transaction_hash,
            },
          },
          name: deployToken.name,
          description: deployToken.description,
          url: deployToken.url,
          image_url: deployToken.image_url,
          symbol: deployToken.symbol,
          total_token_holded: '0',
        },
      });

      try {
        await this.prismaService.token_deploy.updateMany({
          where: {
            memecoin_address: data.memecoinAddress,
          },
          data: {
            is_launched: true,
          },
        });
      } catch (error) {
        console.log('Errpr Update the Token model to launched', error);
      }
    } catch (error) {
      this.logger.error(
        `Error creating buy token record: ${error.message}`,
        error.stack,
      );
    }
  }
}
