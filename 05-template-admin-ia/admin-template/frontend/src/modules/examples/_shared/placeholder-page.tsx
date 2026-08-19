/**
 * Placeholder page — composição genérica para rotas mapeadas no menu cuja
 * fidelidade detalhada não cabe no escopo desta entrega; ainda assim usa apenas
 * composites do design system (PageHeader + Card) e nunca recria visuais em
 * <div> Tailwind no nível da página.
 *
 * Fidelidade: DEFAULT
 */
import type { ReactNode } from "react";
import { PageHeader, Card, EmptyState, Button } from "@/shared/components/ui";
import type { BreadcrumbItem } from "@/shared/components/ui";

export type PlaceholderPageProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  /** Optional copy describing what this section will contain. */
  description?: string;
  /** Mensagem do EmptyState. */
  emptyTitle?: string;
  emptyDescription?: string;
  actionLabel?: string;
  children?: ReactNode;
};

export function PlaceholderPage({
  title,
  subtitle,
  breadcrumbs,
  description,
  emptyTitle = "Em breve",
  emptyDescription = "Esta área foi gerada como placeholder estrutural — composição mínima usando apenas o design system.",
  actionLabel,
  children,
}: PlaceholderPageProps) {
  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={
          breadcrumbs ?? [
            { label: "Início", href: "/dashboard" },
            { label: title },
          ]
        }
      />
      {children ?? (
        <Card>
          <Card.Body>
            <EmptyState
              title={emptyTitle}
              description={description ?? emptyDescription}
              action={
                actionLabel ? (
                  <Button variant="primary">{actionLabel}</Button>
                ) : undefined
              }
            />
          </Card.Body>
        </Card>
      )}
    </>
  );
}
