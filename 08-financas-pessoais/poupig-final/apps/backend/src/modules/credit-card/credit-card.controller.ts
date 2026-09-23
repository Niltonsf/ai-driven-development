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
import {
  CardBrand,
  DeleteCreditCard,
  DeleteCreditCardErrors,
  SaveCreditCard,
  SaveCreditCardErrors,
} from '@poupig/credit-card';
import { CurrentUser } from '../../shared/decorators';
import { CreditCardPrisma } from './credit-card.prisma';

type AuthUser = { id: string; name: string; email: string };

interface SaveCreditCardBody {
  name: string;
  brand: CardBrand;
  closingDay: number;
  dueDay: number;
  description?: string;
  lastFourDigits?: string;
  limit?: number;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

@Controller('cards')
export class CreditCardController {
  constructor(private readonly creditCardPrisma: CreditCardPrisma) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: SaveCreditCardBody, @CurrentUser() user: AuthUser) {
    const { randomUUID } = await import('node:crypto');
    const useCase = new SaveCreditCard(this.creditCardPrisma);
    const result = await useCase.execute({ id: randomUUID(), userId: user.id, ...body });
    if (result.isFailure) {
      const errors = result.errors ?? [];
      if (errors.includes(SaveCreditCardErrors.CREDIT_CARD_NAME_ALREADY_EXISTS)) {
        throw new BadRequestException(SaveCreditCardErrors.CREDIT_CARD_NAME_ALREADY_EXISTS);
      }
      throw new BadRequestException(errors);
    }
    return { success: true };
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('page') pageParam?: string,
    @Query('pageSize') pageSizeParam?: string,
  ) {
    const page = parseInt(pageParam ?? '1', 10) || 1;
    const pageSize = parseInt(pageSizeParam ?? '20', 10) || 20;

    if (pageSize > 50) {
      throw new BadRequestException('PAGE_SIZE_TOO_LARGE');
    }

    const result = await this.creditCardPrisma.findCreditCardsByUserId.execute(user.id, page, pageSize);
    if (result.isFailure) throw new BadRequestException(result.errors);
    return result.instance;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: SaveCreditCardBody, @CurrentUser() user: AuthUser) {
    const useCase = new SaveCreditCard(this.creditCardPrisma);
    const result = await useCase.execute({ id, userId: user.id, ...body });
    if (result.isFailure) {
      const errors = result.errors ?? [];
      if (errors.includes(SaveCreditCardErrors.UNAUTHORIZED)) throw new ForbiddenException(SaveCreditCardErrors.UNAUTHORIZED);
      if (errors.includes(SaveCreditCardErrors.CREDIT_CARD_NAME_ALREADY_EXISTS)) {
        throw new BadRequestException(SaveCreditCardErrors.CREDIT_CARD_NAME_ALREADY_EXISTS);
      }
      throw new BadRequestException(errors);
    }
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const useCase = new DeleteCreditCard(this.creditCardPrisma);
    const result = await useCase.execute({ id, userId: user.id });
    if (result.isFailure) {
      const errors = result.errors ?? [];
      if (errors.includes(DeleteCreditCardErrors.CREDIT_CARD_NOT_FOUND)) throw new NotFoundException(DeleteCreditCardErrors.CREDIT_CARD_NOT_FOUND);
      if (errors.includes(DeleteCreditCardErrors.UNAUTHORIZED)) throw new ForbiddenException(DeleteCreditCardErrors.UNAUTHORIZED);
      throw new BadRequestException(errors);
    }
    return { success: true };
  }
}
