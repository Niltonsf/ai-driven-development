import { DomainError, UseCase } from "@ideias/shared";
import { ProcessingRepository } from "../provider";

export interface DeleteProcessingIn {
  id: string;
  userId: string;
}

export class DeleteProcessing implements UseCase<DeleteProcessingIn, void> {
  constructor(private readonly processingRepository: ProcessingRepository) {}

  async execute(input: DeleteProcessingIn): Promise<void> {
    const existing = await this.processingRepository.findById(input.id);

    // userId diferente tambem retorna not_found: nao vazar existencia
    // cross-user via 403.
    if (!existing || existing.userId !== input.userId) {
      throw new DomainError("processing.not_found", 404);
    }

    // Iteracoes e snapshot de recursos saem em cascata pela FK no banco.
    await this.processingRepository.delete(input.id);
  }
}
