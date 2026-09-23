import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticateUser, AuthenticateUserErrors, CreateUser, CreateUserErrors } from '@poupig/auth';
import { Public } from '../../shared/decorators';
import { PrismaService } from '../../db/prisma.service';
import { UserPrisma } from './user.prisma';
import { PasswordPrisma } from './password.prisma';
import { PasswordCryptoBcrypt } from './password-crypto.bcrypt';

interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userPrisma: UserPrisma,
    private readonly passwordPrisma: PasswordPrisma,
    private readonly passwordCrypto: PasswordCryptoBcrypt,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  getExample() {
    return {
      module: 'auth',
      message: 'auth endpoint is working',
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterBody) {
    const { name, email, password } = body ?? ({} as RegisterBody);

    const createUser = new CreateUser(
      this.userPrisma,
      this.passwordPrisma,
      this.passwordCrypto,
      this.prisma,
    );

    const result = await createUser.execute({ name, email, password });

    if (result.isFailure) {
      const errors = result.errors ?? [];
      if (errors.includes(CreateUserErrors.EMAIL_ALREADY_IN_USE)) {
        throw new ConflictException(CreateUserErrors.EMAIL_ALREADY_IN_USE);
      }
      throw new BadRequestException(errors);
    }

    return { success: true, name, email };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginBody) {
    const { email, password } = body ?? ({} as LoginBody);

    const authenticateUser = new AuthenticateUser(
      this.userPrisma,
      this.passwordPrisma,
      this.passwordCrypto,
    );

    const result = await authenticateUser.execute({ email, password });

    if (result.isFailure) {
      throw new UnauthorizedException(AuthenticateUserErrors.INVALID_CREDENTIALS);
    }

    const user = result.instance;
    const token = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15d' },
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
