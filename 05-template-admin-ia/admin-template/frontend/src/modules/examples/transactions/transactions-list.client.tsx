"use client";
/**
 * Transactions list
 * Replica: sites/demo.tailadmin.com/transactions.html
 * Fidelidade: MÉDIA
 */
import { useMemo, useState } from "react";
import { PageHeader, DataTable, Pagination, Badge, Card, Input } from "@/shared/components/ui";
import type { DataTableColumn } from "@/shared/components/ui";

type Tx = {
  id: string;
  ref: string;
  description: string;
  date: string;
  amount: string;
  type: "Entrada" | "Saída";
  status: "Concluída" | "Pendente" | "Falhou";
};

const txs: Tx[] = Array.from({ length: 28 }, (_, i) => ({
  id: `tx-${i + 1}`,
  ref: `TX-${(50000 + i).toString()}`,
  description: ["Pagamento", "Reembolso", "Compra", "Assinatura", "Transferência"][i % 5],
  date: `2026-04-${String(((i % 28) + 1)).padStart(2, "0")}`,
  amount: `R$ ${(120 + i * 47).toLocaleString("pt-BR")},00`,
  type: i % 3 === 0 ? "Saída" : "Entrada",
  status: (["Concluída", "Pendente", "Falhou"] as const)[i % 3],
}));

const variant = (s: Tx["status"]) => (s === "Concluída" ? "success" : s === "Pendente" ? "warning" : "error");

const PAGE_SIZE = 10;

export function TransactionsListContent() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(
    () => txs.filter((t) => t.ref.toLowerCase().includes(q.toLowerCase()) || t.description.toLowerCase().includes(q.toLowerCase())),
    [q],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: DataTableColumn<Tx>[] = [
    { key: "ref", header: "Referência", cell: (t) => <span className="font-mono">{t.ref}</span> },
    { key: "description", header: "Descrição", cell: (t) => t.description },
    { key: "date", header: "Data", cell: (t) => t.date },
    { key: "type", header: "Tipo", cell: (t) => t.type },
    { key: "amount", header: "Valor", cell: (t) => t.amount, align: "right" },
    { key: "status", header: "Status", cell: (t) => <Badge variant={variant(t.status)}>{t.status}</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="Transactions"
        breadcrumbs={[{ label: "Início", href: "/dashboard" }, { label: "Transactions" }]}
      />
      <Card>
        <DataTable.Toolbar>
          <Input
            placeholder="Buscar transações"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
        </DataTable.Toolbar>
        <DataTable columns={columns} data={slice} rowKey={(t) => t.id} />
        <div className="flex items-center justify-between border-t border-ui-card-border px-5 py-4 sm:px-6">
          <span className="text-sm text-ui-gray-500">
            Mostrando {slice.length} de {filtered.length}
          </span>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>
    </>
  );
}
