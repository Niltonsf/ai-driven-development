"use client";
/**
 * Error boundary (root)
 * Replica: sites/demo.tailadmin.com/500.html
 * Fidelidade: ALTA
 */
import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ui-card-bg px-4 text-center">
      <span className="text-7xl font-bold text-ui-error-500 sm:text-9xl">500</span>
      <h1 className="mt-4 text-2xl font-semibold text-ui-gray-800">Algo deu errado</h1>
      <p className="mt-2 max-w-md text-sm text-ui-gray-500">
        Ocorreu um erro inesperado. Tente novamente ou volte para o início.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-ui-gray-300 bg-white px-4 text-sm font-medium text-ui-gray-700 hover:bg-ui-gray-50"
        >
          Tentar novamente
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center justify-center rounded-lg bg-ui-brand-500 px-4 text-sm font-medium text-white shadow-ui-xs hover:bg-ui-brand-600"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
