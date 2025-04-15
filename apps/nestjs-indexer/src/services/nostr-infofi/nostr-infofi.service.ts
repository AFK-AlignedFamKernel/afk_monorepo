import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NostrInfofiInterface, LinkedDefaultStarknetAddressEventInterface } from './interfaces';

@Injectable()
export class NostrInfofiService {
  private readonly logger = new Logger(NostrInfofiService.name);
  constructor(private readonly prismaService: PrismaService) { }

  async createOrUpdateLinkedDefaultStarknetAddress(data: LinkedDefaultStarknetAddressEventInterface) {
    try {
      console.log("createOrUpdateLinkedDefaultStarknetAddress", data);

    } catch (error) {
      this.logger.error(
        `Error creating linked record: ${error.message}`,
        error.stack,
      );
    }
  }


  async createTipUserWithVote(data: NostrInfofiInterface) {
    try {
      console.log("createTipUserWithVote", data);
    
    } catch (error) {
      this.logger.error(
        `Error creating tip user with vote: ${error.message}`,
        error.stack,
      );
    }
  }
}
