'use client';

// Formulário de cartão (componente de apresentação).
//
// Agnóstico de operação: recebe o DTO compartilhado de cartão como parâmetro e
// se comporta conforme ele — sem DTO opera em modo criação (campos vazios), com
// DTO opera em modo edição (campos pré-preenchidos). NÃO conhece transporte nem
// validação: tudo isso vive em `useCartaoForm` (camada `data/`). Aqui só há UI:
// binding de campos, exibição de erros e estados de submissão.
//
// Campos de texto e numéricos usam binding direto (`register`); cor, ícone e a
// flag `active` (UID customizada) usam `Controller`. Os numéricos são `string`
// no estado do form (input controlado) — a conversão para número vive no schema.

import { Controller } from 'react-hook-form';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import type { CartaoDTO } from '@arquitetura/cartao';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ColorInput } from '@/shared/components/ui/color-input';
import { FormErrorMessage } from '@/shared/components/ui/form-error-message';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { IconCombobox } from '@/shared/components/ui/icon-combobox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { useCartaoForm } from '../data/use-cartao-form.hook';

type CartaoFormProps = {
  /** DTO do cartão. Ausente ⇒ criação; presente ⇒ edição (pré-preenchido). */
  cartao?: CartaoDTO;
  /** Chamado após salvar com sucesso (a página decide a navegação). */
  onSuccess?: () => void;
  /** Chamado ao cancelar (a página decide a navegação). */
  onCancel?: () => void;
};

export function CartaoForm({ cartao, onSuccess, onCancel }: CartaoFormProps) {
  const { form, isEdit, isSubmitting, submitError, submit } = useCartaoForm({ cartao, onSuccess });
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const submitLabel = isEdit ? 'Salvar alterações' : 'Cadastrar cartão';

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-2">
      <FormSectionLayout
        title="Identificação"
        description="Nome e descrição usados para reconhecer o cartão na aplicação."
      >
        <Field label="Nome" htmlFor="cartao-name" required error={errors.name?.message}>
          <Input
            id="cartao-name"
            placeholder="Ex.: Cartão de crédito principal"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </Field>

        <Field label="Descrição" htmlFor="cartao-description" error={errors.description?.message}>
          <Textarea
            id="cartao-description"
            placeholder="Detalhes opcionais sobre o cartão."
            aria-invalid={Boolean(errors.description)}
            {...register('description')}
          />
        </Field>
      </FormSectionLayout>

      <FormSectionLayout
        title="Dados do cartão"
        description="Bandeira, dígitos finais, limite e datas de fatura (opcionais)."
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
          <Field label="Bandeira" htmlFor="cartao-flag" error={errors.flag?.message}>
            <Input
              id="cartao-flag"
              placeholder="Ex.: Visa"
              aria-invalid={Boolean(errors.flag)}
              {...register('flag')}
            />
          </Field>

          <Field
            label="Últimos dígitos"
            htmlFor="cartao-last-digits"
            error={errors.lastDigits?.message}
          >
            <Input
              id="cartao-last-digits"
              inputMode="numeric"
              placeholder="Ex.: 1234"
              aria-invalid={Boolean(errors.lastDigits)}
              {...register('lastDigits')}
            />
          </Field>
        </div>

        <Field label="Limite" htmlFor="cartao-limit" error={errors.limit?.message}>
          <Input
            id="cartao-limit"
            type="number"
            min={0}
            step="0.01"
            placeholder="Ex.: 5000"
            aria-invalid={Boolean(errors.limit)}
            {...register('limit')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
          <Field
            label="Dia de fechamento"
            htmlFor="cartao-closing-day"
            error={errors.closingDay?.message}
          >
            <Input
              id="cartao-closing-day"
              type="number"
              min={1}
              max={31}
              placeholder="Ex.: 5"
              aria-invalid={Boolean(errors.closingDay)}
              {...register('closingDay')}
            />
          </Field>

          <Field label="Dia de vencimento" htmlFor="cartao-due-day" error={errors.dueDay?.message}>
            <Input
              id="cartao-due-day"
              type="number"
              min={1}
              max={31}
              placeholder="Ex.: 15"
              aria-invalid={Boolean(errors.dueDay)}
              {...register('dueDay')}
            />
          </Field>
        </div>
      </FormSectionLayout>

      <FormSectionLayout
        title="Aparência e situação"
        description="Personalize a identificação visual e defina se o cartão está ativo."
        showDivider={false}
      >
        <Field label="Cor" htmlFor="cartao-color" error={errors.color?.message}>
          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <ColorInput
                id="cartao-color"
                value={field.value ?? ''}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </Field>

        <Field label="Ícone" htmlFor="cartao-icon" error={errors.icon?.message}>
          <Controller
            control={control}
            name="icon"
            render={({ field }) => (
              <IconCombobox
                id="cartao-icon"
                value={field.value ?? ''}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </Field>

        <Controller
          control={control}
          name="active"
          render={({ field }) => (
            <label className="flex items-start gap-3 rounded-md border border-input bg-background p-3">
              <Checkbox
                id="cartao-active"
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                disabled={isSubmitting}
                className="mt-0.5"
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium leading-none">Cartão ativo</span>
                <span className="block text-sm text-muted-foreground">
                  Cartões inativos continuam registrados, mas saem do uso corrente.
                </span>
              </span>
            </label>
          )}
        />
      </FormSectionLayout>

      {submitError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-red-500">Não foi possível salvar o cartão</p>
            <FormErrorMessage size="sm">{submitError}</FormErrorMessage>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** Wrapper de campo: rótulo + conteúdo + erro de validação padronizado. */
function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="ml-0.5 text-red-500">*</span> : null}
      </Label>
      {children}
      {error ? <FormErrorMessage>{error}</FormErrorMessage> : null}
    </div>
  );
}
