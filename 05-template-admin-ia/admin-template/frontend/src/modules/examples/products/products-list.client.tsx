"use client";
/**
 * Products list
 * Replica: sites/demo.tailadmin.com/products-list.html
 * Fidelidade: MÉDIA
 */
import { useMemo, useState } from "react";
import {
  PageHeader,
  Button,
  DataTable,
  Pagination,
  Badge,
  Card,
  Input,
  EmptyState,
} from "@/shared/components/ui";
import type { DataTableColumn } from "@/shared/components/ui";
import { products, type Product } from "./mock-data";

const PAGE_SIZE = 10;

const statusVariant: Record<Product["status"], "success" | "gray" | "warning"> = {
  Active: "success",
  Draft: "warning",
  Archived: "gray",
};

const columns: DataTableColumn<Product>[] = [
  { key: "name", header: "Produto", cell: (p) => <span className="font-medium text-ui-gray-800">{p.name}</span> },
  { key: "category", header: "Categoria", cell: (p) => p.category },
  { key: "price", header: "Preço", cell: (p) => `$ ${p.price.toFixed(2)}`, align: "right" },
  { key: "stock", header: "Estoque", cell: (p) => p.stock, align: "right" },
  {
    key: "status",
    header: "Status",
    cell: (p) => <Badge variant={statusVariant[p.status]}>{p.status}</Badge>,
  },
];

export function ProductsListContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Products"
        breadcrumbs={[{ label: "Início", href: "/dashboard" }, { label: "Products" }]}
        actions={<Button>+ Novo produto</Button>}
      />

      <Card>
        <DataTable.Toolbar>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou categoria"
            className="max-w-sm"
          />
        </DataTable.Toolbar>

        {paginated.length === 0 ? (
          <EmptyState
            title="Nenhum produto encontrado"
            description="Ajuste os filtros para ver outros produtos."
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={paginated}
              rowKey={(p) => p.id}
            />
            <div className="flex items-center justify-between border-t border-ui-card-border px-5 py-4 sm:px-6">
              <span className="text-sm text-ui-gray-500">
                Mostrando {paginated.length} de {filtered.length} produtos
              </span>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
    </>
  );
}
