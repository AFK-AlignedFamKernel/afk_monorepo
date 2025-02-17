import { Module } from '@nestjs/common';
import { MetadataLaunchService } from './metadata.service';

@Module({
  imports: [],
  providers: [MetadataLaunchService],
  exports: [MetadataLaunchService],
})
export class MetadataLaunchModule {}
