import { Injectable } from '@nestjs/common';
import {
  AiGenerateInput as ModuleAiGenerateInput,
  AiProvider as ModuleAiProvider,
} from '@ideias/ideas';
import { AiProvider as BackendAiProvider } from '../ai/ai.provider';

// O modulo de negocio depende da abstracao AiProvider exportada por
// @ideias/ideas. Este adapter satisfaz esse contrato delegando para o
// AiProvider do backend (OpenAiProvider da spec 008), sem reimplementar nada.
@Injectable()
export class ModuleAiProviderAdapter extends ModuleAiProvider {
  constructor(private readonly backendAiProvider: BackendAiProvider) {
    super();
  }

  generate(input: ModuleAiGenerateInput): Promise<string> {
    return this.backendAiProvider.generate(input);
  }
}
