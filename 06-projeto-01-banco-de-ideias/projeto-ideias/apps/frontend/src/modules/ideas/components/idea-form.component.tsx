'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Combobox } from '@/shared/components/ui/combobox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import AiTextField from '@/shared/components/ui/ai-text-field';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { getMessage } from '@/shared/i18n';
import {
  IdeaTypeApiError,
  IdeaTypeView,
  listIdeaTypes,
} from '../util/idea-type-api.util';
import {
  IdeaApiError,
  SaveResourceInput,
  createIdea,
  getIdea,
  updateIdea,
} from '../util/idea-api.util';
import { IdeaResourcesInput } from './idea-resources-input.component';

const DESCRIPTION_AI_PROMPT =
  'Você ajuda a escrever a descrição de uma Ideia em português, de forma ' +
  'clara e objetiva, em um parágrafo curto. Gere ou refine a descrição com ' +
  'base no nome da Ideia e no Tipo de Ideia escolhido.';

const OBJECTIVE_AI_PROMPT =
  'Você ajuda a escrever o objetivo de uma Ideia em português, em uma frase ' +
  'curta começando com um verbo no infinitivo, deixando claro o resultado ' +
  'esperado. Gere ou refine o objetivo com base no nome, na descrição e no ' +
  'Tipo de Ideia.';

interface IdeaFormProps {
  ideaId?: string;
}

export function IdeaFormComponent({ ideaId }: IdeaFormProps) {
  const router = useRouter();
  const isEdit = Boolean(ideaId);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [objective, setObjective] = useState('');
  const [ideaTypeId, setIdeaTypeId] = useState('');
  const [resources, setResources] = useState<SaveResourceInput[]>([]);
  const [ideaTypes, setIdeaTypes] = useState<IdeaTypeView[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const typesPromise = listIdeaTypes({ page: 1, pageSize: 100 });
        const ideaPromise = ideaId ? getIdea(ideaId) : Promise.resolve(null);
        const [types, idea] = await Promise.all([typesPromise, ideaPromise]);
        if (!active) return;
        setIdeaTypes(types.items);
        if (idea) {
          setName(idea.name);
          setDescription(idea.description);
          setObjective(idea.objective);
          setIdeaTypeId(idea.ideaTypeId);
          setResources(idea.resources ?? []);
        }
      } catch (error) {
        if (!active) return;
        if (error instanceof IdeaApiError || error instanceof IdeaTypeApiError) {
          error.codes.forEach((code) => toast.error(getMessage(code)));
        } else {
          toast.error(getMessage('DEFAULT_API_ERROR'));
        }
        if (ideaId) router.replace('/ideas');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [ideaId, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = { name, description, objective, ideaTypeId, resources };
      if (isEdit && ideaId) {
        await updateIdea(ideaId, payload);
        toast.success('Ideia atualizada.');
      } else {
        await createIdea(payload);
        toast.success('Ideia cadastrada.');
      }
      router.push('/ideas');
    } catch (error) {
      if (error instanceof IdeaApiError) {
        error.codes.forEach((code) => toast.error(getMessage(code)));
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Carregando…</div>;
  }

  const ideaTypeName =
    ideaTypes.find((type) => type.id === ideaTypeId)?.name ?? '';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <FormSectionLayout
        title="Identificação"
        description="Como esta Ideia será mostrada nas listagens."
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="idea-name">Nome</Label>
          <Input
            id="idea-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            required
          />
        </div>
      </FormSectionLayout>

      <FormSectionLayout
        title="Detalhes"
        description="Descreva a Ideia e o objetivo que ela pretende alcançar."
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="idea-description">Descrição</Label>
          <AiTextField
            id="idea-description"
            value={description}
            onChange={setDescription}
            multiline
            rows={6}
            prompt={DESCRIPTION_AI_PROMPT}
            contextFields={[
              { label: 'Nome', value: name, required: true },
              {
                label: 'Tipo de Ideia',
                value: ideaTypeName,
                required: true,
              },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="idea-objective">Objetivo</Label>
          <AiTextField
            id="idea-objective"
            value={objective}
            onChange={setObjective}
            multiline
            rows={4}
            prompt={OBJECTIVE_AI_PROMPT}
            contextFields={[
              { label: 'Nome', value: name, required: true },
              { label: 'Descrição', value: description, required: true },
              {
                label: 'Tipo de Ideia',
                value: ideaTypeName,
                required: true,
              },
            ]}
          />
        </div>
      </FormSectionLayout>

      <FormSectionLayout
        title="Classificação"
        description="Selecione o Tipo de Ideia que orienta o processamento por IA."
      >
        {ideaTypes.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border p-4">
            <p className="text-sm text-muted-foreground">
              Nenhum Tipo de Ideia cadastrado. Cadastre um Tipo de Ideia antes
              de criar a sua Ideia.
            </p>
            <Button asChild variant="outline">
              <Link href="/idea-types/new">Cadastrar Tipo de Ideia</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="idea-type-id">Tipo de Ideia</Label>
            <Combobox
              options={ideaTypes.map((type) => ({
                label: type.name,
                value: type.id,
              }))}
              value={ideaTypeId}
              onChange={setIdeaTypeId}
              placeholder="Selecione um Tipo de Ideia"
              emptyText="Nenhum Tipo de Ideia encontrado."
            />
          </div>
        )}
      </FormSectionLayout>

      <FormSectionLayout
        title="Recursos"
        description="Acrescente fontes de contexto que serão consideradas no processamento por IA. No momento apenas conteúdo de texto é suportado."
        showDivider={false}
      >
        <IdeaResourcesInput value={resources} onChange={setResources} />
      </FormSectionLayout>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/ideas')}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting || ideaTypes.length === 0}
        >
          {submitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}
