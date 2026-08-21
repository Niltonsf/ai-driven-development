'use client';

import { useRef } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import type { SaveResourceInput } from '../util/idea-api.util';

interface IdeaResourcesInputProps {
  value: SaveResourceInput[];
  onChange: (next: SaveResourceInput[]) => void;
}

function reindex(items: SaveResourceInput[]): SaveResourceInput[] {
  return items.map((item, index) => ({ ...item, position: index }));
}

export function IdeaResourcesInput({
  value,
  onChange,
}: IdeaResourcesInputProps) {
  const textareasRef = useRef<Array<HTMLTextAreaElement | null>>([]);

  function addResource() {
    onChange(
      reindex([
        ...value,
        { type: 'text', content: '', position: value.length },
      ]),
    );
  }

  function updateContent(index: number, content: string) {
    const next = value.map((item, i) =>
      i === index ? { ...item, content } : item,
    );
    onChange(next);
  }

  function removeResource(index: number) {
    onChange(reindex(value.filter((_, i) => i !== index)));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(reindex(next));
  }

  if (value.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-border p-4">
        <p className="text-sm text-muted-foreground">
          Nenhum recurso adicionado.
        </p>
        <Button type="button" variant="outline" onClick={addResource}>
          <Plus className="mr-2 size-4" />
          Adicionar recurso
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {value.map((resource, index) => (
        <div
          key={resource.id ?? `new-${index}`}
          className="flex flex-col gap-2 rounded-md border border-border p-3"
        >
          <div className="flex items-center justify-between">
            <Badge variant="secondary">Texto</Badge>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Mover para cima"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Mover para baixo"
                disabled={index === value.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remover recurso"
                onClick={() => removeResource(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          <Textarea
            ref={(el) => {
              textareasRef.current[index] = el;
            }}
            rows={4}
            value={resource.content}
            aria-label={`Conteúdo do recurso ${index + 1}`}
            onChange={(e) => updateContent(index, e.target.value)}
          />
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" onClick={addResource}>
          <Plus className="mr-2 size-4" />
          Adicionar recurso
        </Button>
      </div>
    </div>
  );
}
