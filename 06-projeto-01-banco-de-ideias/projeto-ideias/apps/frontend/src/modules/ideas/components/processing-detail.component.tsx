'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth';
import {
  ProcessingApiError,
  getProcessing,
  refineProcessing,
} from '../api/processing.api';
import type {
  ProcessingDetail,
  ProcessingIterationView,
} from '../types/processing.type';

interface ProcessingDetailComponentProps {
  processingId: string;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

const PROSE_CLASSES =
  'prose prose-invert prose-sm max-w-none ' +
  'prose-headings:text-foreground prose-strong:text-foreground ' +
  'prose-a:text-primary prose-code:text-primary ' +
  'prose-pre:bg-muted prose-pre:text-foreground';

export function ProcessingDetailComponent({
  processingId,
}: ProcessingDetailComponentProps) {
  const router = useRouter();
  const { token } = useAuth();
  const [detail, setDetail] = useState<ProcessingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [refinement, setRefinement] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const timelineEndRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getProcessing(token, processingId);
      setDetail(data);
    } catch (error) {
      if (error instanceof ProcessingApiError) {
        error.codes.forEach((code) => toast.error(getMessage(code)));
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
      router.replace('/processings');
    } finally {
      setLoading(false);
    }
  }, [token, processingId, router]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRefine() {
    if (!token || !detail) return;
    setSubmitting(true);
    try {
      const iteration = await refineProcessing(token, detail.id, {
        refinement,
      });
      setDetail({
        ...detail,
        iterations: [...detail.iterations, iteration],
      });
      setRefinement('');
      // Scroll ate a nova iteracao apos o estado atualizar.
      setTimeout(() => {
        timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } catch (error) {
      if (error instanceof ProcessingApiError) {
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

  if (!detail) {
    return null;
  }

  const ordered = [...detail.iterations].sort(
    (a, b) => a.position - b.position,
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 border-b border-border pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{detail.ideaName}</h1>
          <Badge variant="secondary">{detail.ideaTypeName}</Badge>
        </div>
        <p className="text-muted-foreground">{detail.ideaObjective}</p>
        <Link
          href={`/ideas/${detail.ideaId}/edit`}
          className="text-sm text-primary hover:underline"
        >
          Ver Ideia original
        </Link>
      </header>

      <div className="rounded-md border border-border">
        <button
          type="button"
          onClick={() => setSummaryOpen((open) => !open)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
        >
          Resumo da Ideia
          <ChevronDown
            className={`size-4 transition-transform ${
              summaryOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
        {summaryOpen ? (
          <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
            <p className="text-sm text-muted-foreground">
              {detail.ideaDescription}
            </p>
            {detail.resources.length > 0 ? (
              <ul className="flex flex-col gap-2 text-sm">
                {detail.resources.map((resource) => (
                  <li
                    key={resource.position}
                    className="rounded-md bg-muted px-3 py-2"
                  >
                    {resource.content}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum recurso de contexto.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4">
        {ordered.map((iteration: ProcessingIterationView) => (
          <Card key={iteration.id}>
            <CardContent className="flex flex-col gap-3 p-5 md:p-6">
              <div className="flex items-center gap-3">
                <Badge>Iteração {iteration.position + 1}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(iteration.createdAt)}
                </span>
              </div>
              {iteration.refinement ? (
                <p className="text-sm italic text-muted-foreground">
                  Refinamento: {iteration.refinement}
                </p>
              ) : null}
              <div className={PROSE_CLASSES}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {iteration.result}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        ))}
        <div ref={timelineEndRef} />
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 -mb-4 border-t border-border bg-background/95 px-4 py-4 backdrop-blur md:-mx-6 md:-mb-6 md:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-2">
          <Label htmlFor="refinement">Refinamento adicional</Label>
          <div className="flex items-end gap-3">
            <Textarea
              id="refinement"
              rows={3}
              value={refinement}
              onChange={(e) => setRefinement(e.target.value)}
              placeholder="Descreva o ajuste desejado para a próxima iteração..."
              className="flex-1"
            />
            <Button
              onClick={handleRefine}
              disabled={submitting || refinement.trim().length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Reprocessando...
                </>
              ) : (
                'Reprocessar'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
