'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import { LucideIconByKey, pickSmartIconColor } from '@/shared/components/ui/lucide-icon-by-key';
import type { CategoryDTO, SubcategoryDTO } from '../data/category-api.client';

const FALLBACK_COLOR = '#6366f1';

type CategoryListProps = {
  categories: CategoryDTO[];
  onEdit: (category: CategoryDTO) => void;
  onDelete: (category: CategoryDTO) => void;
};

function ColorIcon({ name, color, label }: { name?: string; color?: string; label: string }) {
  const background = color ?? FALLBACK_COLOR;

  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: background }}
    >
      {name ? (
        <LucideIconByKey name={name} className="size-4" backgroundColor={background} />
      ) : (
        <span className="text-xs font-bold" style={{ color: pickSmartIconColor(background) }}>
          {label[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );
}

function SubcategoryRow({ subcategory }: { subcategory: SubcategoryDTO }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 px-3 py-2">
      <span className="w-6 shrink-0 text-xs font-medium text-muted-foreground">{subcategory.order}.</span>
      <ColorIcon name={subcategory.icon} color={subcategory.color} label={subcategory.name} />
      <p className="min-w-0 flex-1 truncate text-sm text-foreground">{subcategory.name}</p>
      {!subcategory.isActive ? <Badge variant="secondary">Inativa</Badge> : null}
    </li>
  );
}

export function CategoryListComponent({ categories, onEdit, onDelete }: CategoryListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (categories.length === 0) {
    return (
      <EmptyListState
        title="Nenhuma categoria cadastrada"
        subtitle="Crie uma categoria ou aplique as categorias padrão para começar a organizar suas finanças."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {categories.map((category) => {
        const isExpanded = expandedIds.has(category.id);
        const subcategories = [...category.subcategories].sort((left, right) => left.order - right.order);

        return (
          <li key={category.id} className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleExpanded(category.id)}
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? 'Recolher subcategorias' : 'Expandir subcategorias'}
                >
                  {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>

                <ColorIcon name={category.icon} color={category.color} label={category.name} />

                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{category.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {subcategories.length === 1 ? '1 subcategoria' : `${subcategories.length} subcategorias`}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={category.isActive ? 'secondary' : 'outline'}>
                  {category.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => onEdit(category)} aria-label="Editar categoria">
                  <Pencil className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDelete(category)} aria-label="Excluir categoria">
                  <Trash2 className="size-4 text-red-500" />
                </Button>
              </div>
            </div>

            {isExpanded ? (
              <div className="mt-3 border-t border-border/40 pt-3 pl-12">
                {subcategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma subcategoria cadastrada.</p>
                ) : (
                  <ul className="space-y-2">
                    {subcategories.map((subcategory) => (
                      <SubcategoryRow key={subcategory.id} subcategory={subcategory} />
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
