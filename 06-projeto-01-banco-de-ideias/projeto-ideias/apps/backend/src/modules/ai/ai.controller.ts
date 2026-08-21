import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DomainError } from '@ideias/shared';
import { AiProvider } from './ai.provider';

interface GenerateBody {
  prompt?: unknown;
  context?: unknown;
  instruction?: unknown;
}

interface GenerateResponse {
  text: string;
}

interface UploadedAudio {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

interface TranscribeResponse {
  text: string;
}

const PROMPT_MAX = 8000;
const CONTEXT_MAX = 16000;
const INSTRUCTION_MAX = 2000;
const AUDIO_MAX_BYTES = 25 * 1024 * 1024;

@Controller('ai')
export class AiController {
  constructor(private readonly aiProvider: AiProvider) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(@Body() body: GenerateBody): Promise<GenerateResponse> {
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const context =
      typeof body.context === 'string' ? body.context : undefined;
    const instruction =
      typeof body.instruction === 'string' ? body.instruction : undefined;

    if (prompt.length < 1 || prompt.length > PROMPT_MAX) {
      throw new DomainError('ai.prompt.invalid', 422);
    }
    if (
      (context !== undefined && context.length > CONTEXT_MAX) ||
      (instruction !== undefined && instruction.length > INSTRUCTION_MAX)
    ) {
      throw new DomainError('ai.input.too_long', 422);
    }

    const parts: string[] = [];
    if (context && context.trim()) {
      parts.push(`Contexto:\n${context}`);
    }
    if (instruction && instruction.trim()) {
      parts.push(`Instrução adicional do usuário: ${instruction}`);
    }
    const userMessage =
      parts.length > 0 ? parts.join('\n\n') : 'Gere o conteúdo solicitado.';

    const text = await this.aiProvider.generate({
      systemPrompt: prompt,
      userMessage,
    });
    return { text };
  }

  @Post('transcribe')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async transcribe(
    @UploadedFile() file?: UploadedAudio,
  ): Promise<TranscribeResponse> {
    if (!file || !file.buffer || file.size < 1) {
      throw new DomainError('ai.audio.required', 422);
    }
    if (!file.mimetype || !file.mimetype.startsWith('audio/')) {
      throw new DomainError('ai.audio.invalid_type', 422);
    }
    if (file.size > AUDIO_MAX_BYTES) {
      throw new DomainError('ai.audio.too_large', 422);
    }

    const text = await this.aiProvider.transcribe({
      buffer: file.buffer,
      fileName: file.originalname || 'audio.webm',
      mimeType: file.mimetype,
    });
    return { text };
  }
}
