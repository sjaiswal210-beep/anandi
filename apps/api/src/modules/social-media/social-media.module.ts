import { Module } from '@nestjs/common';
import { SocialMediaController } from './social-media.controller';
import { SocialMediaService } from './social-media.service';
import { SocialImageService } from './social-image.service';
import { MetaPublishService } from './meta-publish.service';

@Module({
  controllers: [SocialMediaController],
  providers: [SocialMediaService, SocialImageService, MetaPublishService],
  exports: [SocialMediaService, SocialImageService, MetaPublishService],
})
export class SocialMediaModule {}
