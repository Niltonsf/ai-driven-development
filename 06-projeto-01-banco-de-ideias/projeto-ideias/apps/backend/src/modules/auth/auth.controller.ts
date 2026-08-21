import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginUser, RegisterUser } from '@ideias/auth';
import type { LoginUserIn, RegisterUserIn } from '@ideias/auth';
import { Public } from '../../shared/decorators/public.decorator';
import { UserPrismaRepository } from './user.prisma';
import { CryptoBcryptProvider } from './crypto.bcrypt';
import { signUserToken } from './jwt.util';

interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userRepository: UserPrismaRepository,
    private readonly cryptoProvider: CryptoBcryptProvider,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterUserIn): Promise<void> {
    const useCase = new RegisterUser(this.cryptoProvider, this.userRepository);
    await useCase.execute(body);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginUserIn): Promise<LoginResponse> {
    const useCase = new LoginUser(this.cryptoProvider, this.userRepository);
    const user = await useCase.execute(body);
    const secret = this.configService.get<string>('JWT_SECRET') ?? '';
    const expiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '14d';
    const token = signUserToken(user, secret, expiresIn);
    return { token, user };
  }
}
