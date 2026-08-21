import { Module } from '@nestjs/common';
import { AiProvider } from '@ideias/ideas';
import { DbModule } from '../../db/db.module';
import { AiModule } from '../ai/ai.module';
import { IdeaTypeController } from './idea-type.controller';
import { IdeaTypePrismaRepository } from './idea-type.prisma';
import { IdeaController } from './idea.controller';
import { IdeaPrismaRepository } from './idea.prisma';
import { ProcessingController } from './processing.controller';
import { ProcessingPrismaRepository } from './processing.prisma';
import { DashboardController } from './dashboard.controller';
import { ModuleAiProviderAdapter } from './ai-provider.adapter';

@Module({
  imports: [DbModule, AiModule],
  controllers: [
    IdeaTypeController,
    IdeaController,
    ProcessingController,
    DashboardController,
  ],
  providers: [
    IdeaTypePrismaRepository,
    IdeaPrismaRepository,
    ProcessingPrismaRepository,
    { provide: AiProvider, useClass: ModuleAiProviderAdapter },
  ],
})
export class IdeasModule {}
