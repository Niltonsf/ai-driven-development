'use client';

// Hook de dados do formulário de contas.
//
// Concentra TODA a orquestração do formulário: validação (resolver do schema),
// chamada à API e os estados de submissão (ocioso / enviando / erro / sucesso).
// O componente de formulário apenas consome este hook — não conhece transporte,
// não sabe traduzir erros e não decide regras de validação.

import { useCallback, useMemo, useState } from 'react';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import type { ContaDTO } from '@arquitetura/contas';
import { ApiError } from '@/shared/lib/api-client';
import { getErrorMessage } from '@/shared/i18n';
import { v } from '@/shared/components/form/validator';
import { salvarConta } from './contas.client';
import {
  contaFormSchema,
  toContaFormDefaults,
  toSalvarContaPayload,
  type ContaFormData,
} from './conta-form.schema';

/** Estados possíveis da submissão do formulário. */
export type ContaFormStatus = 'idle' | 'submitting' | 'error' | 'success';

export type UseContaFormParams = {
  /** DTO da conta. Ausente ⇒ modo criação; presente ⇒ modo edição. */
  conta?: ContaDTO;
  /** Disparado após uma submissão bem-sucedida (ex.: navegar de volta). */
  onSuccess?: () => void;
};

export type UseContaFormResult = {
  form: UseFormReturn<ContaFormData>;
  /** `true` quando há uma conta existente (edição), `false` na criação. */
  isEdit: boolean;
  status: ContaFormStatus;
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

export function useContaForm({ conta, onSuccess }: UseContaFormParams): UseContaFormResult {
  const isEdit = Boolean(conta?.id);
  const [status, setStatus] = useState<ContaFormStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const defaultValues = useMemo(() => toContaFormDefaults(conta), [conta]);

  const form = useForm<ContaFormData>({
    resolver: v.resolver(contaFormSchema),
    defaultValues,
  });

  const submit = useCallback(
    (event?: React.BaseSyntheticEvent) =>
      form.handleSubmit(async (data) => {
        setStatus('submitting');
        setSubmitError(null);

        try {
          await salvarConta(toSalvarContaPayload(data, conta));
          setStatus('success');
          toast.success(isEdit ? 'Conta atualizada com sucesso.' : 'Conta criada com sucesso.');
          onSuccess?.();
        } catch (cause: unknown) {
          setStatus('error');
          setSubmitError(resolveSubmitError(cause));
        }
      })(event),
    [conta, form, isEdit, onSuccess],
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
