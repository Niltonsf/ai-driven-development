/**
 * 404 (root)
 * Replica: sites/demo.tailadmin.com/404.html
 * Fidelidade: ALTA
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ui-card-bg px-4 text-center">
      <span className="text-7xl font-bold text-ui-brand-500 sm:text-9xl">404</span>
      <h1 className="mt-4 text-2xl font-semibold text-ui-gray-800">
        Página não encontrada
      </h1>
      <p className="mt-2 max-w-md text-sm text-ui-gray-500">
        A página que você está procurando não existe ou foi movida.
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
