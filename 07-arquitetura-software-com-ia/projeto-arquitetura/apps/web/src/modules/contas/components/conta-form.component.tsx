'use client';

// Formulário de conta (componente de apresentação).
//
// Agnóstico de operação: recebe o DTO compartilhado de conta como parâmetro e
// se comporta conforme ele — sem DTO opera em modo criação (campos vazios), com
// DTO opera em modo edição (campos pré-preenchidos). NÃO conhece transporte nem
// validação: tudo isso vive em `useContaForm` (camada `data/`). Aqui só há UI:
// binding de campos, exibição de erros e estados de submissão.

import { Controller } from 'react-hook-form';
import { AlertCircle, Loader2, Save } from 'lucide-react';
import type { ContaDTO } from '@arquitetura/contas';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { ColorInput } from '@/shared/components/ui/color-input';
import { FormErrorMessage } from '@/shared/components/ui/form-error-message';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { IconCombobox } from '@/shared/components/ui/icon-combobox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { useContaForm } from '../data/use-conta-form.hook';

type ContaFormProps = {
  /** DTO da conta. Ausente ⇒ criação; presente ⇒ edição (pré-preenchido). */
  conta?: ContaDTO;
  /** Chamado após salvar com sucesso (a página decide a navegação). */
  onSuccess?: () => void;
  /** Chamado ao cancelar (a página decide a navegação). */
  onCancel?: () => void;
};

export function ContaForm({ conta, onSuccess, onCancel }: ContaFormProps) {
  const { form, isEdit, isSubmitting, submitError, submit } = useContaForm({ conta, onSuccess });
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const submitLabel = isEdit ? 'Salvar alterações' : 'Cadastrar conta';

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-2">
      <FormSectionLayout
        title="Identificação"
        description="Nome e descrição usados para reconhecer a conta na aplicação."
      >
        <Field label="Nome" htmlFor="conta-name" required error={errors.name?.message}>
          <Input
            id="conta-name"
            placeholder="Ex.: Conta corrente principal"
            aria-invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </Field>

        <Field label="Descrição" htmlFor="conta-description" error={errors.description?.message}>
          <Textarea
            id="conta-description"
            placeholder="Detalhes opcionais sobre a conta."
            aria-invalid={Boolean(errors.description)}
            {...register('description')}
          />
        </Field>
      </FormSectionLayout>

      <FormSectionLayout
        title="Dados bancários"
        description="Informações da instituição financeira (opcionais)."
      >
        <Field label="Instituição" htmlFor="conta-institution" error={errors.institutionName?.message}>
          <Input
            id="conta-institution"
            placeholder="Ex.: Banco Exemplo"
            aria-invalid={Boolean(errors.institutionName)}
            {...register('institutionName')}
          />
        </Field>

        <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
          <Field label="Agência" htmlFor="conta-agency" error={errors.agency?.message}>
            <Input
              id="conta-agency"
              placeholder="Ex.: 0001"
              aria-invalid={Boolean(errors.agency)}
              {...register('agency')}
            />
          </Field>

          <Field label="Número da conta" htmlFor="conta-number" error={errors.accountNumber?.message}>
            <Input
              id="conta-number"
              placeholder="Ex.: 123456-7"
              aria-invalid={Boolean(errors.accountNumber)}
              {...register('accountNumber')}
            />
          </Field>
        </div>
      </FormSectionLayout>

      <FormSectionLayout
        title="Aparência e situação"
        description="Personalize a identificação visual e defina se a conta está ativa."
        showDivider={false}
      >
        <Field label="Cor" htmlFor="conta-color" error={errors.color?.message}>
          <Controller
            control={control}
            name="color"
            render={({ field }) => (
              <ColorInput
                id="conta-color"
                value={field.value ?? ''}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </Field>

        <Field label="Ícone" htmlFor="conta-icon" error={errors.icon?.message}>
          <Controller
            control={control}
            name="icon"
            render={({ field }) => (
              <IconCombobox
                id="conta-icon"
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
                id="conta-active"
                checked={Boolean(field.value)}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                disabled={isSubmitting}
                className="mt-0.5"
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium leading-none">Conta ativa</span>
                <span className="block text-sm text-muted-foreground">
                  Contas inativas continuam registradas, mas saem do uso corrente.
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
            <p className="text-sm font-medium text-red-500">Não foi possível salvar a conta</p>
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
