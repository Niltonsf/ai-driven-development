"use client";
/**
 * Users list (canonical CRUD example)
 * Sem equivalente direto no template — defaults coerentes para o conjunto mínimo.
 * Fidelidade: DEFAULT
 */
import { useMemo, useState } from "react";
import {
  PageHeader,
  Button,
  DataTable,
  Pagination,
  Badge,
  Avatar,
  Card,
  Input,
  EmptyState,
  Modal,
} from "@/shared/components/ui";
import type { DataTableColumn } from "@/shared/components/ui";
import { users, type User } from "./mock-data";

const PAGE_SIZE = 8;

const statusVariant: Record<User["status"], "success" | "gray" | "warning"> = {
  Ativo: "success",
  Inativo: "gray",
  Pendente: "warning",
};

export function UsersListContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<User | null>(null);

  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns: DataTableColumn<User>[] = [
    {
      key: "name",
      header: "Usuário",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar fallback={u.name.split(" ").map((p) => p[0]).join("").slice(0, 2)} size="sm" alt={u.name} />
          <div>
            <div className="font-medium text-ui-gray-800">{u.name}</div>
            <div className="text-xs text-ui-gray-500">{u.email}</div>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Papel", cell: (u) => u.role },
    {
      key: "status",
      header: "Status",
      cell: (u) => <Badge variant={statusVariant[u.status]}>{u.status}</Badge>,
    },
    {
      key: "createdAt",
      header: "Criado em",
      cell: (u) => new Intl.DateTimeFormat("pt-BR").format(new Date(u.createdAt)),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (u) => (
        <Button variant="ghost" size="sm" onClick={() => setToDelete(u)}>
          Remover
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Usuários"
        breadcrumbs={[{ label: "Início", href: "/dashboard" }, { label: "Usuários" }]}
        actions={<Button>+ Novo usuário</Button>}
      />
      <Card>
        <DataTable.Toolbar>
          <Input
            placeholder="Buscar por nome ou email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-sm"
          />
        </DataTable.Toolbar>
        {slice.length === 0 ? (
          <EmptyState
            title="Nenhum usuário encontrado"
            description="Ajuste a busca ou crie um novo usuário."
          />
        ) : (
          <>
            <DataTable columns={columns} data={slice} rowKey={(u) => u.id} />
            <div className="flex items-center justify-between border-t border-ui-card-border px-5 py-4 sm:px-6">
              <span className="text-sm text-ui-gray-500">
                Mostrando {slice.length} de {filtered.length}
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

      <Modal open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>Remover usuário</Modal.Title>
            <Modal.Description>
              Tem certeza que deseja remover {toDelete?.name}? Esta ação é apresentacional — sem efeito real.
            </Modal.Description>
          </Modal.Header>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => setToDelete(null)}>
              Remover
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </>
  );
}
