'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  SeriesDataRequestDTO,
  SeriesDataSummaryDTO,
  TransactionDataRequestDTO,
  TransactionDataSummaryDTO,
} from '@poupig/dev';
import { getErrorMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/data/auth.context';
import {
  DataGeneratorApiError,
  fetchDataGeneratorStatus,
  generateSeriesData,
  generateTransactionData,
} from './data-generator-api.client';
import { DEV_TOOLS_ENABLED } from './dev-tools.env';

const NOT_FOUND_STATUS = 404;

export type DataGeneratorStatus = 'loading' | 'enabled' | 'disabled' | 'error';

export type GenerateTransactionDataResult =
  | { ok: true; summary: TransactionDataSummaryDTO }
  | { ok: false; error: string };

export type GenerateSeriesDataResult = { ok: true; summary: SeriesDataSummaryDTO } | { ok: false; error: string };

/**
 * Answer of the status request made with the token in `key`. Loading is derived
 * by comparing this key with the current token, so no state is written
 * synchronously inside the effect.
 */
type StatusResponse = {
  key: string;
  status: Exclude<DataGeneratorStatus, 'loading'>;
  error: string | null;
};

function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof DataGeneratorApiError) {
    return err.codes.map((code) => getErrorMessage(code)).join(' ');
  }
  if (err instanceof Error && err.message) return getErrorMessage(err);
  return fallback;
}

/**
 * Whether the generator can be used. With the frontend switch off the answer is
 * computed (`'disabled'`) and no request is made. With it on, the backend status
 * is read once per token; `404` means the backend switch is off.
 */
export function useDataGeneratorStatus(): { status: DataGeneratorStatus; error: string | null } {
  const { token } = useAuth();
  const [response, setResponse] = useState<StatusResponse | null>(null);

  useEffect(() => {
    if (!DEV_TOOLS_ENABLED || !token) return;
    let isCurrent = true;

    fetchDataGeneratorStatus(token)
      .then(({ enabled }) => {
        if (isCurrent) setResponse({ key: token, status: enabled ? 'enabled' : 'disabled', error: null });
      })
      .catch((err: unknown) => {
        if (!isCurrent) return;
        if (err instanceof DataGeneratorApiError && err.status === NOT_FOUND_STATUS) {
          setResponse({ key: token, status: 'disabled', error: null });
          return;
        }
        setResponse({
          key: token,
          status: 'error',
          error: toErrorMessage(err, 'Erro ao consultar a disponibilidade do gerador.'),
        });
      });

    // A newer token (or unmount) makes this response obsolete.
    return () => {
      isCurrent = false;
    };
  }, [token]);

  if (!DEV_TOOLS_ENABLED) return { status: 'disabled', error: null };
  if (!token || response?.key !== token) return { status: 'loading', error: null };
  return { status: response.status, error: response.error };
}

/** Runs the one-off transaction generator and keeps the last summary. State is written only in the handler. */
export function useGenerateTransactionData() {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState<TransactionDataSummaryDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (payload: TransactionDataRequestDTO): Promise<GenerateTransactionDataResult> => {
      if (!token) {
        const message = 'Não autenticado.';
        setError(message);
        return { ok: false, error: message };
      }

      setIsSubmitting(true);
      setError(null);
      try {
        const result = await generateTransactionData(token, payload);
        setSummary(result);
        return { ok: true, summary: result };
      } catch (err: unknown) {
        const message = toErrorMessage(err, 'Erro ao gerar a massa de dados.');
        setError(message);
        return { ok: false, error: message };
      } finally {
        setIsSubmitting(false);
      }
    },
    [token],
  );

  return { generate, isSubmitting, summary, error };
}

/** Runs the series generator and keeps the last summary. State is written only in the handler. */
export function useGenerateSeriesData() {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState<SeriesDataSummaryDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (payload: SeriesDataRequestDTO): Promise<GenerateSeriesDataResult> => {
      if (!token) {
        const message = 'Não autenticado.';
        setError(message);
        return { ok: false, error: message };
      }

      setIsSubmitting(true);
      setError(null);
      try {
        const result = await generateSeriesData(token, payload);
        setSummary(result);
        return { ok: true, summary: result };
      } catch (err: unknown) {
        const message = toErrorMessage(err, 'Erro ao gerar as séries.');
        setError(message);
        return { ok: false, error: message };
      } finally {
        setIsSubmitting(false);
      }
    },
    [token],
  );

  return { generate, isSubmitting, summary, error };
}
