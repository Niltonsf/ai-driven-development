import { randomInt } from 'node:crypto';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import {
  DevDataErrors,
  PlanSeriesData,
  PlanTransactionData,
  type SeriesDataSummaryDTO,
  type TransactionDataSummaryDTO,
} from '@poupig/dev';
import type { AuthenticatedUser } from '@poupig/shared';
import { CurrentUser } from '../../shared/decorators';
import { DataGeneratorWriter } from './data-generator.writer';
import { DevConfig } from './dev.config';

/**
 * Data generator routes, private like every route (global `JwtGuard`) and
 * available only when `DEV_TOOLS_ENABLED` is `"true"`. The owner always comes
 * from the token; the body never provides `userId`.
 */
@Controller('dev/data-generator')
export class DevController {
  constructor(
    private readonly devConfig: DevConfig,
    private readonly writer: DataGeneratorWriter,
  ) {}

  @Get('status')
  status(): { enabled: boolean } {
    this.assertEnabled();
    return { enabled: true };
  }

  /** A run that answers with its summary, not a created resource: `200`. */
  @Post('transactions')
  @HttpCode(HttpStatus.OK)
  async generateTransactions(
    @Body() body: Record<string, unknown> | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TransactionDataSummaryDTO> {
    this.assertEnabled();

    const data = body ?? {};
    // UTC is the generator's definition of "today" (unlike the statement, which uses the local date).
    const today = new Date().toISOString().slice(0, 10);
    const links = await this.writer.loadLinks(user.id);

    const planResult = await new PlanTransactionData(() =>
      randomInt(0, 2 ** 31),
    ).execute({
      request: {
        accounts: this.toNumber(data.accounts) ?? 0,
        creditCards: this.toNumber(data.creditCards) ?? 0,
        transactions: this.toNumber(data.transactions) ?? 0,
        months: this.toNumber(data.months),
        seed: this.toNumber(data.seed),
      },
      today,
      links: links.counts,
    });
    if (planResult.isFailure) throw new BadRequestException(planResult.errors);

    return this.writer.writeTransactionData(
      user.id,
      planResult.instance,
      links,
    );
  }

  /** Same shape as `POST transactions`: a run that answers with its summary, `200`. */
  @Post('series')
  @HttpCode(HttpStatus.OK)
  async generateSeries(
    @Body() body: Record<string, unknown> | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SeriesDataSummaryDTO> {
    this.assertEnabled();

    const data = body ?? {};
    // UTC is the generator's definition of "today" (unlike the statement, which uses the local date).
    const today = new Date().toISOString().slice(0, 10);
    const links = await this.writer.loadLinks(user.id);

    const planResult = await new PlanSeriesData(() =>
      randomInt(0, 2 ** 31),
    ).execute({
      request: {
        recurrences: this.toNumber(data.recurrences) ?? 0,
        installmentPlans: this.toNumber(data.installmentPlans) ?? 0,
        months: this.toNumber(data.months),
        seed: this.toNumber(data.seed),
      },
      today,
      links: links.counts,
    });
    if (planResult.isFailure) throw new BadRequestException(planResult.errors);

    return this.writer.writeSeriesData(user.id, planResult.instance, links);
  }

  /** Off answers `404` with a code the frontend translates, before the body is read. */
  private assertEnabled(): void {
    if (!this.devConfig.isEnabled) {
      throw new NotFoundException([DevDataErrors.DEV_DATA_DISABLED]);
    }
  }

  /**
   * Body numbers may arrive as strings. `undefined`, `null` and blank strings
   * mean "absent"; any other string goes through `Number`, so text becomes
   * `NaN` and the domain rejects it with the code of its field — never a
   * silent zero. Any other type is `NaN` for the same reason.
   */
  private toNumber(value: unknown): number | undefined {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed === '' ? undefined : Number(trimmed);
    }
    return Number.NaN;
  }
}
