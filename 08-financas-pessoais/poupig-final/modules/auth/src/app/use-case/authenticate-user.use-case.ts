import { Result, UseCase } from '@poupig/shared';
import { PasswordCryptoProvider, PasswordRepository } from '../../password';
import { UserRepository } from '../../user/provider';

export const AuthenticateUserErrors = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
} as const;

export interface AuthenticateUserInput {
  email: string;
  password: string;
}

export interface AuthenticateUserOutput {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export class AuthenticateUser implements UseCase<AuthenticateUserInput, AuthenticateUserOutput> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordRepository: PasswordRepository,
    private readonly passwordCryptoProvider: PasswordCryptoProvider,
  ) {}

  async execute(input: AuthenticateUserInput): Promise<Result<AuthenticateUserOutput>> {
    const userResult = await this.userRepository.findByEmail(input.email);
    if (userResult.isFailure) {
      return Result.fail(AuthenticateUserErrors.USER_NOT_FOUND);
    }

    const user = userResult.instance;

    const passwordResult = await this.passwordRepository.findById(user.id);
    if (passwordResult.isFailure) {
      return Result.fail(AuthenticateUserErrors.INVALID_CREDENTIALS);
    }

    const password = passwordResult.instance;

    const isValid = await this.passwordCryptoProvider.compare(input.password, password.value);
    if (!isValid) {
      return Result.fail(AuthenticateUserErrors.INVALID_CREDENTIALS);
    }

    return Result.ok({
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    });
  }
}
