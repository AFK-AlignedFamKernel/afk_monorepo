import { Module } from '@nestjs/common';
import { NameServiceService } from './name-service.service';

@Module({
  imports: [],
  providers: [NameServiceService],
  exports: [NameServiceService],
})
export class NameServiceModule {}
