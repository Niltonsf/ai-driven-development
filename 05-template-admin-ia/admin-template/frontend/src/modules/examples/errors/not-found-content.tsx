/**
 * 404 (showcase route inside admin shell)
 * Replica: sites/demo.tailadmin.com/404.html
 * Fidelidade: ALTA
 */
import Link from "next/link";

export function NotFoundShowcase() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <span className="text-7xl font-bold text-ui-brand-500 sm:text-9xl">404</span>
      <h1 className="mt-4 text-2xl font-semibold text-ui-gray-800">Página não encontrada</h1>
      <p className="mt-2 max-w-md text-sm text-ui-gray-500">
        A página que você está procurando não existe ou foi movida para outro endereço.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-ui-brand-500 px-4 text-sm font-medium text-white shadow-ui-xs hover:bg-ui-brand-600"
      >
        Voltar para o início
      </Link>
    </div>
  );
}
