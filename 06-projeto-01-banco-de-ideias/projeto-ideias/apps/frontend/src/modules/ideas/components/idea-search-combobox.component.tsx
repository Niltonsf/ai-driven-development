'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { getMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth';
import {
  ProcessingApiError,
  searchIdeasForProcessing,
} from '../api/processing.api';
import type { IdeaSearchResult } from '../types/processing.type';

interface IdeaSearchComboboxProps {
  onSelect: (idea: IdeaSearchResult) => void;
  selectedId?: string;
}

const DEBOUNCE_MS = 300;

export function IdeaSearchCombobox({
  onSelect,
  selectedId,
}: IdeaSearchComboboxProps) {
  const { token } = useAuth();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<IdeaSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (value: string) => {
      if (!token) return;
      setLoading(true);
      try {
        const data = await searchIdeasForProcessing(token, value);
        setResults(data);
      } catch (error) {
        if (error instanceof ProcessingApiError) {
          error.codes.forEach((code) => toast.error(getMessage(code)));
        } else {
          toast.error(getMessage('DEFAULT_API_ERROR'));
        }
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  // Ao montar (term vazio) ja busca as 20 Ideias mais recentes do usuario.
  useEffect(() => {
    search('');
  }, [search]);

  function handleChange(value: string) {
    setTerm(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      search(value);
    }, DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Buscar Ideia por nome ou tipo..."
          className="pl-9"
          autoComplete="off"
        />
        {loading ? (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        {!loading && results.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma Ideia encontrada.
          </p>
        ) : null}
        {results.map((idea) => (
          <button
            key={idea.id}
            type="button"
            onClick={() => onSelect(idea)}
            className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition-colors hover:border-primary hover:bg-accent ${
              selectedId === idea.id
                ? 'border-primary bg-accent'
                : 'border-border'
            }`}
          >
            <span className="font-medium">{idea.name}</span>
            <Badge variant="secondary">{idea.ideaTypeName}</Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
