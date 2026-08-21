import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiProvider, OpenAiProvider } from './ai.provider';

@Module({
  controllers: [AiController],
  providers: [{ provide: AiProvider, useClass: OpenAiProvider }],
  exports: [AiProvider],
})
export class AiModule {}
