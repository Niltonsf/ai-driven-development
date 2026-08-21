'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import AiTextField from '@/shared/components/ui/ai-text-field';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { getMessage } from '@/shared/i18n';
import {
  IDEA_TYPE_PROMPT_HINT,
  IdeaTypeApiError,
  createIdeaType,
  getIdeaType,
  updateIdeaType,
} from '../util/idea-type-api.util';

const DESCRIPTION_AI_PROMPT =
  'Você ajuda a descrever um Tipo de Ideia em uma frase curta (até 2 linhas) ' +
  'e em português, de forma clara, objetiva e direta. Gere ou refine a ' +
  'descrição com base no nome do Tipo de Ideia.';

const PROMPT_AI_PROMPT =
  'Você ajuda a escrever um prompt especializado para um Tipo de Ideia que ' +
  'será usado depois pela IA para gerar o Resultado de uma Ideia. O prompt ' +
  'resultante deve estar em português, ser detalhado, instruir o modelo ' +
  'sobre tom, estrutura e formato esperado, e usar os marcadores {{name}}, ' +
  '{{description}}, {{objective}} e {{resources}} exatamente assim para ' +
  'inserir os dados da Ideia ao processar. Gere ou refine o prompt com base ' +
  'no nome e na descrição do Tipo de Ideia.';

interface IdeaTypeFormProps {
  ideaTypeId?: string;
}

export function IdeaTypeFormComponent({ ideaTypeId }: IdeaTypeFormProps) {
  const router = useRouter();
  const isEdit = Boolean(ideaTypeId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!ideaTypeId) return;
    let active = true;
    (async () => {
      try {
        const data = await getIdeaType(ideaTypeId);
        if (!active) return;
        setName(data.name);
        setDescription(data.description);
        setPrompt(data.prompt);
      } catch (error) {
        if (!active) return;
        if (error instanceof IdeaTypeApiError) {
          error.codes.forEach((code) => toast.error(getMessage(code)));
        } else {
          toast.error(getMessage('DEFAULT_API_ERROR'));
        }
        router.replace('/idea-types');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [ideaTypeId, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = { name, description, prompt };
      if (isEdit && ideaTypeId) {
        await updateIdeaType(ideaTypeId, payload);
        toast.success('Tipo de Ideia atualizado.');
      } else {
        await createIdeaType(payload);
        toast.success('Tipo de Ideia cadastrado.');
      }
      router.push('/idea-types');
    } catch (error) {
      if (error instanceof IdeaTypeApiError) {
        error.codes.forEach((code) => toast.error(getMessage(code)));
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Carregando…</div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FormSectionLayout
        title="Identificação"
        description="Como este Tipo de Ideia será mostrado nas listagens."
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="idea-type-name">Nome</Label>
          <Input
            id="idea-type-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="idea-type-description">Descrição</Label>
          <AiTextField
            id="idea-type-description"
            value={description}
            onChange={setDescription}
            multiline
            rows={3}
            prompt={DESCRIPTION_AI_PROMPT}
            contextFields={[{ label: 'Nome', value: name, required: true }]}
          />
        </div>
      </FormSectionLayout>

      <FormSectionLayout
        title="Prompt especializado"
        description="Texto usado pela IA ao processar Ideias deste tipo."
        showDivider={false}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="idea-type-prompt">Prompt</Label>
          <AiTextField
            id="idea-type-prompt"
            value={prompt}
            onChange={setPrompt}
            multiline
            rows={12}
            prompt={PROMPT_AI_PROMPT}
            contextFields={[
              { label: 'Nome', value: name, required: true },
              { label: 'Descrição', value: description, required: true },
            ]}
          />
          <p className="text-xs text-muted-foreground">{IDEA_TYPE_PROMPT_HINT}</p>
        </div>
      </FormSectionLayout>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/idea-types')}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}
