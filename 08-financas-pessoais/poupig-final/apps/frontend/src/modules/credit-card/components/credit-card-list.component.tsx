'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { EmptyListState } from '@/shared/components/ui/empty-list-state';
import { LucideIconByKey, pickSmartIconColor } from '@/shared/components/ui/lucide-icon-by-key';
import type { CreditCardDTO, CardBrand } from '../data/credit-card-api.client';

const BRAND_LABELS: Record<CardBrand, string> = {
  VISA: 'Visa',
  MASTERCARD: 'Mastercard',
  ELO: 'Elo',
  AMEX: 'American Express',
  HIPERCARD: 'Hipercard',
  DINERS: 'Diners Club',
  OTHER: 'Outro',
};

function formatLimit(limitInCents?: number): string {
  if (!limitInCents) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(limitInCents / 100);
}

type CreditCardListProps = {
  cards: CreditCardDTO[];
  onEdit: (card: CreditCardDTO) => void;
  onDelete: (card: CreditCardDTO) => void;
};

export function CreditCardListComponent({ cards, onEdit, onDelete }: CreditCardListProps) {
  if (cards.length === 0) {
    return (
      <EmptyListState
        title="Nenhum cartão cadastrado"
        subtitle="Adicione um cartão para começar a organizar suas finanças."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {cards.map((card) => (
        <li
          key={card.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: card.color ?? '#6366f1' }}
            >
              {card.icon ? (
                <LucideIconByKey name={card.icon} className="size-4" backgroundColor={card.color ?? '#6366f1'} />
              ) : (
                <span
                  className="text-xs font-bold"
                  style={{ color: pickSmartIconColor(card.color ?? '#6366f1') }}
                >
                  {card.name[0]?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {card.name}
                {card.lastFourDigits ? (
                  <span className="ml-2 text-sm text-muted-foreground">•••• {card.lastFourDigits}</span>
                ) : null}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                Limite: {formatLimit(card.limit)} · Fechamento: dia {card.closingDay} · Vencimento: dia {card.dueDay}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary">{BRAND_LABELS[card.brand] ?? card.brand}</Badge>
            <Button variant="ghost" size="icon" onClick={() => onEdit(card)} aria-label="Editar cartão">
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(card)} aria-label="Excluir cartão">
              <Trash2 className="size-4 text-red-500" />
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
