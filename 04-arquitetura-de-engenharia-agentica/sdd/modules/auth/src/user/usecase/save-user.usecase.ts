import { UseCase } from "@sdd/shared";
import { User } from "../model";
import { CryptoProvider, UserRepository } from "../provider";

export interface SaveUserIn {
  id?: string;
  name: string;
  email: string;
  password?: string;
}

export class SaveUser implements UseCase<SaveUserIn, void> {
  constructor(
    private readonly cryptoProvider: CryptoProvider,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: SaveUserIn): Promise<void> {
    const existing = input.id ? await this.userRepository.findById(input.id) : null;

    if (existing) {
      const password = input.password
        ? await this.cryptoProvider.hashPassword(input.password)
        : existing.password;

      const updated = existing.clone({ name: input.name, email: input.email, password });
      updated.validate();
      await this.userRepository.update(updated);
    } else {
      const password = await this.cryptoProvider.hashPassword(input.password ?? "");
      const user = new User({ id: input.id, name: input.name, email: input.email, password });
      user.validate();
      await this.userRepository.create(user);
    }
  }
}
