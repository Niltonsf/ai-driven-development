import { Email, PersonName, Result, StrongPassword, TransactionManager, UseCase } from '@poupig/shared';
import { Password, PasswordCryptoProvider, PasswordRepository } from '../../password';
import { User } from '../../user/model';
import { UserRepository } from '../../user/provider';

export const CreateUserErrors = {
  EMAIL_ALREADY_IN_USE: 'EMAIL_ALREADY_IN_USE',
} as const;

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

export class CreateUser implements UseCase<CreateUserInput, void> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordRepository: PasswordRepository,
    private readonly passwordCryptoProvider: PasswordCryptoProvider,
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(input: CreateUserInput): Promise<Result<void>> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing.isOk) {
      return Result.fail(CreateUserErrors.EMAIL_ALREADY_IN_USE);
    }

    const name = PersonName.tryCreate(input.name);
    const email = Email.tryCreate(input.email);
    const strongPassword = StrongPassword.tryCreate(input.password);

    const validation = Result.combine([name, email, strongPassword]);
    if (validation.isFailure) return Result.fail(validation.errors!);

    const userResult = User.tryCreate({
      name: name.instance.value,
      email: email.instance.value,
      avatarUrl: null,
    });
    if (userResult.isFailure) return Result.fail(userResult.errors!);

    const passwordResult = Password.tryCreate({
      id: userResult.instance.id,
      value: strongPassword.instance.value,
    });
    if (passwordResult.isFailure) return Result.fail(passwordResult.errors!);

    const encrypted = await this.passwordCryptoProvider.encrypt(strongPassword.instance.value);
    const encryptedPassword = passwordResult.instance.toEncrypted(encrypted);
    if (encryptedPassword.isFailure) return Result.fail(encryptedPassword.errors!);

    const user = userResult.instance;
    const passwordToPersist = encryptedPassword.instance;

    return Result.tryAsync(async () => {
      await this.transactionManager.runInTransaction(async (ctx) => {
        const createdUser = await this.userRepository.create(user, ctx);
        createdUser.validator.throwsIfFailed();

        const createdPassword = await this.passwordRepository.create(passwordToPersist, ctx);
        createdPassword.validator.throwsIfFailed();
      });
    });
  }
}
