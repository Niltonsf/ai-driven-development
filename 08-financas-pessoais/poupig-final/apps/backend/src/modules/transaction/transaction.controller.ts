import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
  DeleteTransaction,
  Direction,
  SaveTransaction,
  SaveTransactionInput,
  TransactionErrors,
  TransactionStatus,
} from '@poupig/transaction';
import { CurrentUser } from '../../shared/decorators';
import { parseBooleanFlag } from './transaction-query.util';
import { TransactionPrisma } from './transaction.prisma';

type AuthUser = { id: string; name: string; email: string };

interface SaveTransactionBody {
  name: string;
  note?: string | null;
  value: number | string;
  direction: Direction;
  accountId: string;
  creditCardId?: string | null;
  subcategoryId?: string | null;
  status?: TransactionStatus;
  expectedOn: string;
  settledOn?: string | null;
}

/**
 * `value` may arrive as a string: an empty string becomes `undefined` and a
 * non-numeric one becomes `NaN`, both rejected by `Money` with `INVALID_MONEY_AMOUNT`.
 */
function parseValue(value: unknown): number {
  if (typeof value !== 'string') return value as number;
  return (value.trim() === '' ? undefined : Number(value)) as number;
}

/** Picks only the accepted fields: `id` and `userId` never come from the body. */
function toSaveInput(
  body: SaveTransactionBody | undefined,
  userId: string,
  id?: string,
): SaveTransactionInput {
  const data = body ?? ({} as SaveTransactionBody);
  return {
    id,
    userId,
    name: data.name,
    note: data.note,
    value: parseValue(data.value),
    direction: data.direction,
    accountId: data.accountId,
    creditCardId: data.creditCardId,
    subcategoryId: data.subcategoryId,
    status: data.status,
    expectedOn: data.expectedOn,
    settledOn: data.settledOn,
  };
}

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionPrisma: TransactionPrisma) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: SaveTransactionBody,
    @CurrentUser() user: AuthUser,
  ) {
    const useCase = new SaveTransaction(
      this.transactionPrisma,
      this.transactionPrisma.movementReferences,
    );
    const result = await useCase.execute(toSaveInput(body, user.id));
    if (result.isFailure) throw this.toHttpException(result.errors);
    return result.instance;
  }

  @Get()
  async findAll(
    @CurrentUser() user: AuthUser,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: string,
    @Query('accountId') accountId?: string,
    @Query('expectedFrom') expectedFrom?: string,
    @Query('expectedTo') expectedTo?: string,
    @Query('creditCardId') creditCardId?: string,
    @Query('onlyCreditCard') onlyCreditCard?: string,
  ) {
    const parsedPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const parsedPageSize = Math.min(
      100,
      Math.max(1, parseInt(pageSize ?? '10', 10) || 10),
    );
    const result = await this.transactionPrisma.listTransactions.execute({
      userId: user.id,
      page: parsedPage,
      pageSize: parsedPageSize,
      search,
      direction,
      status,
      accountId,
      expectedFrom,
      expectedTo,
      creditCardId: creditCardId?.trim() || undefined,
      onlyCreditCard: parseBooleanFlag(onlyCreditCard),
    });
    if (result.isFailure) throw this.toHttpException(result.errors);
    return result.instance;
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result = await this.transactionPrisma.findTransactionById.execute(
      id,
      user.id,
    );
    if (result.isFailure) throw this.toHttpException(result.errors);
    if (!result.instance) {
      throw new NotFoundException(TransactionErrors.TRANSACTION_NOT_FOUND);
    }
    return result.instance;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: SaveTransactionBody,
    @CurrentUser() user: AuthUser,
  ) {
    const useCase = new SaveTransaction(
      this.transactionPrisma,
      this.transactionPrisma.movementReferences,
    );
    const result = await useCase.execute(toSaveInput(body, user.id, id));
    if (result.isFailure) throw this.toHttpException(result.errors);
    return result.instance;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const useCase = new DeleteTransaction(this.transactionPrisma);
    const result = await useCase.execute({ id, userId: user.id });
    if (result.isFailure) throw this.toHttpException(result.errors);
    return { success: true };
  }

  private toHttpException(errors: string[]) {
    if (errors.includes(TransactionErrors.TRANSACTION_NOT_FOUND)) {
      return new NotFoundException(TransactionErrors.TRANSACTION_NOT_FOUND);
    }
    return new BadRequestException(errors);
  }
}
