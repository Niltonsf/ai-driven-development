import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { toFile } from 'openai';
import { DomainError } from '@ideias/shared';

export interface AiGenerateInput {
  systemPrompt: string;
  userMessage: string;
}

export interface AiTranscribeInput {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

export abstract class AiProvider {
  abstract generate(input: AiGenerateInput): Promise<string>;
  abstract transcribe(input: AiTranscribeInput): Promise<string>;
}

@Injectable()
export class OpenAiProvider extends AiProvider {
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly transcriptionModel: string;

  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') ?? '';
    this.model =
      this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
    this.transcriptionModel =
      this.configService.get<string>('OPENAI_TRANSCRIPTION_MODEL') ??
      'whisper-1';
    this.client = new OpenAI({ apiKey });
  }

  async generate({ systemPrompt, userMessage }: AiGenerateInput): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (!text) {
        throw new DomainError('ai.generate.empty', 502);
      }
      return text;
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      this.logger.error(
        `OpenAI generate failed: ${(error as Error)?.message}`,
        (error as Error)?.stack,
      );
      throw new DomainError('ai.generate.failed', 502);
    }
  }

  async transcribe({
    buffer,
    fileName,
    mimeType,
  }: AiTranscribeInput): Promise<string> {
    try {
      const file = await toFile(buffer, fileName, { type: mimeType });
      const result = await this.client.audio.transcriptions.create({
        file,
        model: this.transcriptionModel,
      });

      const text = result.text?.trim();
      if (!text) {
        throw new DomainError('ai.transcribe.empty', 502);
      }
      return text;
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      this.logger.error(
        `OpenAI transcribe failed: ${(error as Error)?.message}`,
        (error as Error)?.stack,
      );
      throw new DomainError('ai.transcribe.failed', 502);
    }
  }
}
