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
  DeleteTransactionSeries,
  Direction,
  FrequencyUnit,
  SaveTransactionSeries,
  SaveTransactionSeriesInput,
  SeriesKind,
  TransactionSeriesErrors,
} from '@poupig/transaction';
import { CurrentUser } from '../../shared/decorators';
import { TransactionPrisma } from './transaction.prisma';
import { TransactionSeriesPrisma } from './transaction-series.prisma';

type AuthUser = { id: string; name: string; email: string };

/** The recurrence rule travels flattened in the body, as a form produces it. */
interface SaveTransactionSeriesBody {
  name: string;
  note?: string | null;
  value: number | string;
  direction: Direction;
  accountId: string;
  creditCardId?: string | null;
  subcategoryId?: string | null;
  kind: SeriesKind;
  unit: FrequencyUnit;
  interval?: number | string;
  weekDay?: number | string;
  dayOfMonth?: number | string;
  month?: number | string;
  startDate: string;
  endDate?: string | null;
  installments?: number | string | null;
}

/**
 * Numbers may arrive as strings: an empty value becomes `undefined` and a
 * non-numeric one becomes `NaN`, both rejected by the domain with the code of
 * the attribute, so `NaN` is never persisted.
 */
function parseNumber(value?: number | string | null): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return value;
  return Number(value.trim());
}

/**
 * Picks only the accepted fields: `id` and `userId` never come from the body.
 * `unit`, `kind` and `direction` travel as they came, for the domain to judge.
 */
function toSaveInput(
  body: SaveTransactionSeriesBody | undefined,
  userId: string,
  id?: string,
): SaveTransactionSeriesInput {
  const data = body ?? ({} as SaveTransactionSeriesBody);
  return {
    id,
    userId,
    name: data.name,
    note: data.note,
    value: parseNumber(data.value) as number,
    direction: data.direction,
    accountId: data.accountId,
    creditCardId: data.creditCardId,
    subcategoryId: data.subcategoryId,
    kind: data.kind,
    recurrence: {
      unit: data.unit,
      interval: parseNumber(data.interval),
      weekDay: parseNumber(data.weekDay),
      dayOfMonth: parseNumber(data.dayOfMonth),
      month: parseNumber(data.month),
    },
    startDate: data.startDate,
    endDate: data.endDate,
    installments: parseNumber(data.installments),
  };
}

@Controller('transaction-series')
export class TransactionSeriesController {
  constructor(
    private readonly transactionSeriesPrisma: TransactionSeriesPrisma,
    private readonly transactionPrisma: TransactionPrisma,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: SaveTransactionSeriesBody,
    @CurrentUser() user: AuthUser,
  ) {
    const useCase = new SaveTransactionSeries(
      this.transactionSeriesPrisma,
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
    @Query('kind') kind?: string,
    @Query('direction') direction?: string,
    @Query('accountId') accountId?: string,
  ) {
    const parsedPage = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const parsedPageSize = Math.min(
      50,
      Math.max(1, parseInt(pageSize ?? '10', 10) || 10),
    );
    const result =
      await this.transactionSeriesPrisma.listTransactionSeries.execute({
        userId: user.id,
        page: parsedPage,
        pageSize: parsedPageSize,
        search,
        kind,
        direction,
        accountId,
      });
    if (result.isFailure) throw this.toHttpException(result.errors);
    return result.instance;
  }

  @Get(':id')
  async findById(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const result =
      await this.transactionSeriesPrisma.findTransactionSeriesById.execute(
        id,
        user.id,
      );
    if (result.isFailure) throw this.toHttpException(result.errors);
    if (!result.instance) {
      throw new NotFoundException(
        TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND,
      );
    }
    return result.instance;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: SaveTransactionSeriesBody,
    @CurrentUser() user: AuthUser,
  ) {
    const useCase = new SaveTransactionSeries(
      this.transactionSeriesPrisma,
      this.transactionPrisma.movementReferences,
    );
    const result = await useCase.execute(toSaveInput(body, user.id, id));
    if (result.isFailure) throw this.toHttpException(result.errors);
    return result.instance;
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const useCase = new DeleteTransactionSeries(this.transactionSeriesPrisma);
    const result = await useCase.execute({ id, userId: user.id });
    if (result.isFailure) throw this.toHttpException(result.errors);
    return { success: true };
  }

  private toHttpException(errors: string[]) {
    if (errors.includes(TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND)) {
      return new NotFoundException(
        TransactionSeriesErrors.TRANSACTION_SERIES_NOT_FOUND,
      );
    }
    return new BadRequestException(errors);
  }
}
