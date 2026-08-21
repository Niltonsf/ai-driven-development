'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth';
import { ProcessingApiError, startProcessing } from '../api/processing.api';
import type { IdeaSearchResult } from '../types/processing.type';
import { IdeaSearchCombobox } from './idea-search-combobox.component';

export function ProcessingNewComponent() {
  const router = useRouter();
  const { token } = useAuth();
  const [selected, setSelected] = useState<IdeaSearchResult | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleProcess() {
    if (!selected || !token) return;
    setProcessing(true);
    try {
      const detail = await startProcessing(token, { ideaId: selected.id });
      toast.success('Processamento criado.');
      router.push(`/processings/${detail.id}`);
    } catch (error) {
      if (error instanceof ProcessingApiError) {
        error.codes.forEach((code) => toast.error(getMessage(code)));
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageSectionHeader
        badge="Processamentos"
        title="Novo Processamento"
        subtitle="Selecione uma Ideia para gerar o primeiro resultado com IA."
      />

      <IdeaSearchCombobox
        onSelect={(idea) => setSelected(idea)}
        selectedId={selected?.id}
      />

      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span>{selected.name}</span>
              <Badge variant="secondary">{selected.ideaTypeName}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button onClick={handleProcess} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Processando ideia...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Processar
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
