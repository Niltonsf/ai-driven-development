export interface AiGenerateInput {
  systemPrompt: string;
  userMessage: string;
}

// Porta de IA do modulo de negocio: os casos de uso dependem desta abstracao,
// nunca da implementacao concreta do backend. E uma classe abstrata (e nao
// uma interface) para tambem servir como token de injecao no NestJS — o
// backend registra um adapter sob este token, delegando para o OpenAiProvider
// da spec 008.
export abstract class AiProvider {
  abstract generate(input: AiGenerateInput): Promise<string>;
}
