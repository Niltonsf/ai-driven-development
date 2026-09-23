import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AccountType, DeleteAccount, DeleteAccountErrors, SaveAccount, SaveAccountErrors } from '@poupig/account';
import { CurrentUser } from '../../shared/decorators';
import { AccountPrisma } from './account.prisma';

type AuthUser = { id: string; name: string; email: string };

interface SaveAccountBody {
  name: string;
  type: AccountType;
  description?: string;
  accountNumber?: string;
  agency?: string;
  financialInstitution?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

@Controller('accounts')
export class AccountController {
  constructor(private readonly accountPrisma: AccountPrisma) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: SaveAccountBody, @CurrentUser() user: AuthUser) {
    const { randomUUID } = await import('node:crypto');
    const useCase = new SaveAccount(this.accountPrisma);
    const result = await useCase.execute({ id: randomUUID(), userId: user.id, ...body });
    if (result.isFailure) {
      const errors = result.errors ?? [];
      if (errors.includes(SaveAccountErrors.ACCOUNT_NAME_ALREADY_EXISTS)) {
        throw new BadRequestException(SaveAccountErrors.ACCOUNT_NAME_ALREADY_EXISTS);
      }
      throw new BadRequestException(errors);
    }
    return { success: true };
  }

  @Get()
  async findAll(@CurrentUser() user: AuthUser, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const parsedPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const parsedPageSize = Math.min(50, Math.max(1, parseInt(pageSize ?? '10', 10) || 10));
    const result = await this.accountPrisma.findAccountsByUserId.execute(user.id, parsedPage, parsedPageSize);
    if (result.isFailure) throw new BadRequestException(result.errors);
    return result.instance;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: SaveAccountBody, @CurrentUser() user: AuthUser) {
    const useCase = new SaveAccount(this.accountPrisma);
    const result = await useCase.execute({ id, userId: user.id, ...body });
    if (result.isFailure) {
      const errors = result.errors ?? [];
      if (errors.includes(SaveAccountErrors.UNAUTHORIZED)) throw new ForbiddenException(SaveAccountErrors.UNAUTHORIZED);
      if (errors.includes(SaveAccountErrors.ACCOUNT_NAME_ALREADY_EXISTS)) {
        throw new BadRequestException(SaveAccountErrors.ACCOUNT_NAME_ALREADY_EXISTS);
      }
      throw new BadRequestException(errors);
    }
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const useCase = new DeleteAccount(this.accountPrisma);
    const result = await useCase.execute({ id, userId: user.id });
    if (result.isFailure) {
      const errors = result.errors ?? [];
      if (errors.includes(DeleteAccountErrors.ACCOUNT_NOT_FOUND)) throw new NotFoundException(DeleteAccountErrors.ACCOUNT_NOT_FOUND);
      if (errors.includes(DeleteAccountErrors.UNAUTHORIZED)) throw new ForbiddenException(DeleteAccountErrors.UNAUTHORIZED);
      throw new BadRequestException(errors);
    }
    return { success: true };
  }
}
