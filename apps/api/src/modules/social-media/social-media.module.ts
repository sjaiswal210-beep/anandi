import { Module } from '@nestjs/common';
import { SocialMediaController } from './social-media.controller';
import { SocialMediaService } from './social-media.service';
import { SocialImageService } from './social-image.service';

@Module({
  controllers: [SocialMediaController],
  providers: [SocialMediaService, SocialImageService],
  exports: [SocialMediaService, SocialImageService],
})
export class SocialMediaModule {}
