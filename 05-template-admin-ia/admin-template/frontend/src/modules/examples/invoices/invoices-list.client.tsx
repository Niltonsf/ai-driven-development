"use client";
/**
 * Invoices list
 * Replica: sites/demo.tailadmin.com/invoices.html
 * Fidelidade: MÉDIA
 */
import { useMemo, useState } from "react";
import { PageHeader, Button, DataTable, Pagination, Badge, Card, Input } from "@/shared/components/ui";
import type { DataTableColumn } from "@/shared/components/ui";

type Invoice = {
  id: string;
  number: string;
  client: string;
  date: string;
  amount: string;
  status: "Pago" | "Pendente" | "Atrasado";
};

const invoices: Invoice[] = Array.from({ length: 24 }, (_, i) => ({
  id: `inv-${i + 1}`,
  number: `INV-${(2024010 + i).toString()}`,
  client: ["Acme Corp.", "Globex", "Initech", "Umbrella", "Soylent", "Hooli"][i % 6],
  date: `2026-${String(((i % 12) + 1)).padStart(2, "0")}-15`,
  amount: `R$ ${(1200 + i * 137).toLocaleString("pt-BR")},00`,
  status: (["Pago", "Pendente", "Atrasado"] as const)[i % 3],
}));

const variant = (s: Invoice["status"]) =>
  s === "Pago" ? "success" : s === "Pendente" ? "warning" : "error";

const PAGE_SIZE = 8;

export function InvoicesListContent() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const filtered = useMemo(
    () => invoices.filter((i) => i.number.toLowerCase().includes(q.toLowerCase()) || i.client.toLowerCase().includes(q.toLowerCase())),
    [q],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: DataTableColumn<Invoice>[] = [
    { key: "number", header: "Número", cell: (i) => <span className="font-mono text-ui-gray-700">{i.number}</span> },
    { key: "client", header: "Cliente", cell: (i) => i.client },
    { key: "date", header: "Data", cell: (i) => i.date },
    { key: "amount", header: "Valor", cell: (i) => i.amount, align: "right" },
    { key: "status", header: "Status", cell: (i) => <Badge variant={variant(i.status)}>{i.status}</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="Invoices"
        breadcrumbs={[{ label: "Início", href: "/dashboard" }, { label: "Invoices" }]}
        actions={<Button>+ Nova invoice</Button>}
      />
      <Card>
        <DataTable.Toolbar>
          <Input
            placeholder="Buscar por número ou cliente"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
        </DataTable.Toolbar>
        <DataTable columns={columns} data={slice} rowKey={(i) => i.id} />
        <div className="flex items-center justify-between border-t border-ui-card-border px-5 py-4 sm:px-6">
          <span className="text-sm text-ui-gray-500">
            Mostrando {slice.length} de {filtered.length} invoices
          </span>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>
    </>
  );
}
