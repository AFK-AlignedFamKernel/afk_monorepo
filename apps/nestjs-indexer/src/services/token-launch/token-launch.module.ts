import { Module } from '@nestjs/common';
import { TokenLaunchService } from './token-launch.service';

@Module({
  imports: [],
  providers: [TokenLaunchService],
  exports: [TokenLaunchService],
})
export class TokenLaunchModule {}
