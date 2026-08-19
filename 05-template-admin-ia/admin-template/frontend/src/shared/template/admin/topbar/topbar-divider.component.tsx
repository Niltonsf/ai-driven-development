/**
 * TopbarDivider — separador vertical entre grupos de ações.
 * Mantido como primitivo apesar de o template não usar divisor explícito; útil para extensibilidade.
 */
export function TopbarDivider() {
  return <span aria-hidden className="mx-1 h-6 w-px bg-adminTopbar-border" />;
}
