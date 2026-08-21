import { DomainError } from "@ideias/shared";
import { AiGenerateInput, AiProvider } from "../../../src/processing/provider";

export class FakeAiProvider extends AiProvider {
  public calls: AiGenerateInput[] = [];

  constructor(private readonly fixedResult = "Resultado gerado pela IA.") {
    super();
  }

  async generate(input: AiGenerateInput): Promise<string> {
    this.calls.push(input);
    return this.fixedResult;
  }
}

export class FailingAiProvider extends AiProvider {
  async generate(): Promise<string> {
    throw new DomainError("ai.generate.failed", 502);
  }
}
