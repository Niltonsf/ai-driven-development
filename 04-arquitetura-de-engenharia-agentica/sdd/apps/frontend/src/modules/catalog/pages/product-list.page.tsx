'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, PackagePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { DeleteConfirmationDialog } from '@/shared/components/ui/delete-confirmation-dialog';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { PaginationControls } from '@/shared/components/ui/pagination-controls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table';
import { TableCard } from '@/shared/components/ui/table-card';
import { getMessage } from '@/shared/i18n';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import { useAuth } from '@/modules/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ProductStatus = 'active' | 'inactive' | 'draft';

interface ProductItem {
  id: string;
  name: string;
  price: number;
  status: ProductStatus;
}

interface PageResult {
  items: ProductItem[];
  total: number;
  page: number;
  perPage: number;
}

const PER_PAGE = 10;
const PRICE_FORMATTER = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function formatPrice(value: number) {
  return PRICE_FORMATTER.format(Number(value));
}

export function ProductListPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/products?page=${targetPage}&perPage=${PER_PAGE}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const body: PageResult = await res.json();
        setData(body);
      } catch {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchProducts(page);
  }, [fetchProducts, page]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/products/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 204) {
        toast.success('Produto excluído com sucesso.');
        setDeleteTarget(null);
        const nextPage = data && data.items.length === 1 && page > 1 ? page - 1 : page;
        setPage(nextPage);
        fetchProducts(nextPage);
        return;
      }
      const body: ApiErrorResponse = await res.json();
      for (const code of body.errors) toast.error(getMessage(code));
    } catch {
      toast.error(getMessage('DEFAULT_API_ERROR'));
    } finally {
      setIsDeleting(false);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PER_PAGE)) : 1;

  return (
    <div className="space-y-6">
      <PageSectionHeader
        badge="Catálogo"
        title="Produtos"
        subtitle="Gerencie os produtos do catálogo."
        aside={
          <Button onClick={() => router.push('/catalog/products/new')}>
            <PackagePlus className="size-4" />
            Novo produto
          </Button>
        }
      />

      <TableCard
        footer={
          <PaginationControls
            page={page}
            totalPages={totalPages}
            totalItems={data?.total}
            totalLabel="produtos"
            onPageChange={setPage}
            disabled={loading}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-5">Nome</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right px-5">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : !data || data.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="px-5 font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{formatPrice(product.price)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {getMessage(`product.status.${product.status}`)}
                  </TableCell>
                  <TableCell className="px-5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Editar ${product.name}`}
                        onClick={() => router.push(`/catalog/products/${product.id}/edit`)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Excluir ${product.name}`}
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(product)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableCard>

      <DeleteConfirmationDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        onConfirm={handleDelete}
        title="Excluir produto"
        description="Esta ação remove o produto de forma permanente."
        itemLabel="Produto"
        itemValue={deleteTarget?.name}
        isConfirming={isDeleting}
      />
    </div>
  );
}
