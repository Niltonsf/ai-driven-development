import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LoginUser,
  type LoginUserIn,
  RegisterUser,
  type RegisterUserIn,
} from '@sdd/auth';
import { Public } from '../../shared/decorators/public.decorator';
import { BcryptCryptoProvider } from './crypto.provider';
import { signUserToken } from './jwt.util';
import { PrismaUserRepository } from './user.prisma';

interface LoginResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userRepository: PrismaUserRepository,
    private readonly cryptoProvider: BcryptCryptoProvider,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  async register(@Body() body: RegisterUserIn): Promise<void> {
    const useCase = new RegisterUser(this.cryptoProvider, this.userRepository);
    await useCase.execute(body);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginUserIn): Promise<LoginResponse> {
    const useCase = new LoginUser(this.cryptoProvider, this.userRepository);
    const user = await useCase.execute(body);
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    const token = signUserToken(user, secret);
    return { token, user };
  }
}
