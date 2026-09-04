'use client';

// Hook de dados do formulário de cartões.
//
// Concentra TODA a orquestração do formulário: validação (resolver do schema),
// chamada à API e os estados de submissão (ocioso / enviando / erro / sucesso).
// O componente de formulário apenas consome este hook — não conhece transporte,
// não sabe traduzir erros e não decide regras de validação.

import { useCallback, useMemo, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import type { CartaoDTO } from '@arquitetura/cartao';
import { ApiError } from '@/shared/lib/api-client';
import { getErrorMessage } from '@/shared/i18n';
import { v } from '@/shared/components/form/validator';
import { salvarCartao } from './cartoes.client';
import {
  cartaoFormSchema,
  toCartaoFormDefaults,
  toSalvarCartaoPayload,
  type CartaoFormData,
} from './cartao-form.schema';

/** Estados possíveis da submissão do formulário. */
export type CartaoFormStatus = 'idle' | 'submitting' | 'error' | 'success';

export type UseCartaoFormParams = {
  /** DTO do cartão. Ausente ⇒ modo criação; presente ⇒ modo edição. */
  cartao?: CartaoDTO;
  /** Disparado após uma submissão bem-sucedida (ex.: navegar de volta). */
  onSuccess?: () => void;
};

export type UseCartaoFormResult = {
  form: UseFormReturn<CartaoFormData>;
  /** `true` quando há um cartão existente (edição), `false` na criação. */
  isEdit: boolean;
  status: CartaoFormStatus;
  isSubmitting: boolean;
  /** Erro de submissão (transporte/negócio) já traduzido para exibição. */
  submitError: string | null;
  /** Handler pronto para `<form onSubmit={...}>`. */
  submit: (event?: React.BaseSyntheticEvent) => Promise<void>;
};

/** Traduz qualquer falha de submissão para uma mensagem amigável. */
function resolveSubmitError(cause: unknown): string {
  if (cause instanceof ApiError) {
    // O backend responde erros de negócio em `{ message: string[] }`.
    return getErrorMessage({ response: { data: cause.details } });
  }

  return getErrorMessage(cause);
}

export function useCartaoForm({ cartao, onSuccess }: UseCartaoFormParams): UseCartaoFormResult {
  const isEdit = Boolean(cartao?.id);
  const [status, setStatus] = useState<CartaoFormStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues = useMemo(() => toCartaoFormDefaults(cartao), [cartao]);

  const form = useForm<CartaoFormData>({
    resolver: v.resolver(cartaoFormSchema),
    defaultValues,
  });

  const submit = useCallback(
    (event?: React.BaseSyntheticEvent) =>
      form.handleSubmit(async (data) => {
        setStatus('submitting');
        setSubmitError(null);

        try {
          await salvarCartao(toSalvarCartaoPayload(data, cartao));
          setStatus('success');
          toast.success(isEdit ? 'Cartão atualizado com sucesso.' : 'Cartão criado com sucesso.');
          onSuccess?.();
        } catch (cause: unknown) {
          setStatus('error');
          setSubmitError(resolveSubmitError(cause));
        }
      })(event),
    [cartao, form, isEdit, onSuccess],
  );

  return {
    form,
    isEdit,
    status,
    isSubmitting: status === 'submitting',
    submitError,
    submit,
  };
}
