import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DeleteUser, SaveUser, type SaveUserIn } from '@sdd/auth';
import { BcryptCryptoProvider } from './crypto.provider';
import { PrismaUserRepository } from './user.prisma';

interface UserPageQuery {
  page?: string;
  perPage?: string;
}

@Controller('users')
export class UserController {
  constructor(
    private readonly userRepository: PrismaUserRepository,
    private readonly cryptoProvider: BcryptCryptoProvider,
  ) {}

  @Post()
  @HttpCode(201)
  async create(@Body() body: SaveUserIn): Promise<void> {
    const useCase = new SaveUser(this.cryptoProvider, this.userRepository);
    await useCase.execute(body);
  }

  @Put(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() body: Omit<SaveUserIn, 'id'>): Promise<void> {
    const useCase = new SaveUser(this.cryptoProvider, this.userRepository);
    await useCase.execute({ ...body, id });
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string): Promise<void> {
    const useCase = new DeleteUser(this.userRepository);
    await useCase.execute({ id });
  }

  @Get(':id')
  @HttpCode(200)
  async findById(@Param('id') id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) return null;
    return { id: user.id, name: user.name, email: user.email };
  }

  @Get()
  @HttpCode(200)
  async findPage(@Query() query: UserPageQuery) {
    const page = Number(query.page ?? 1);
    const perPage = Number(query.perPage ?? 10);
    const result = await this.userRepository.findPage({ page, perPage });
    return {
      ...result,
      items: result.items.map((user) => ({ id: user.id, name: user.name, email: user.email })),
    };
  }
}
