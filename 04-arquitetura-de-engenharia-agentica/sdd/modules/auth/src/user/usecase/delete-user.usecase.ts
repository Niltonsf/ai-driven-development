import { DomainError, UseCase } from "@sdd/shared";
import { UserRepository } from "../provider";

export interface DeleteUserIn {
  id: string;
}

export class DeleteUser implements UseCase<DeleteUserIn, void> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: DeleteUserIn): Promise<void> {
    const existing = await this.userRepository.findById(input.id);
    if (!existing) {
      throw new DomainError("user.not_found", 404);
    }
    await this.userRepository.delete(input.id);
  }
}
