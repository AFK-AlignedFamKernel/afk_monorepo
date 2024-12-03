import { Module } from '@nestjs/common';
import { DeployTokenService } from './deploy-token.service';

@Module({
  imports: [],
  providers: [DeployTokenService],
  exports: [DeployTokenService],
})
export class DeployTokenModule {}
