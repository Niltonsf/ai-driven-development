'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Combobox } from '@/shared/components/ui/combobox';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { PageSectionHeader } from '@/shared/components/ui/page-section-header';
import { Textarea } from '@/shared/components/ui/textarea';
import { getMessage } from '@/shared/i18n';
import type { ApiErrorResponse } from '@/shared/types/api-error.type';
import { useAuth } from '@/modules/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ProductStatus = 'active' | 'inactive' | 'draft';

interface ProductFormProps {
  productId?: string;
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  status: ProductStatus;
  availableOnline: boolean;
  featured: boolean;
  allowsPreOrder: boolean;
}

const STATUS_OPTIONS: { label: string; value: ProductStatus }[] = [
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
  { label: 'Rascunho', value: 'draft' },
];

export function ProductFormPage({ productId }: ProductFormProps) {
  const { token } = useAuth();
  const router = useRouter();
  const isEdit = Boolean(productId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<ProductStatus>('active');
  const [availableOnline, setAvailableOnline] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [allowsPreOrder, setAllowsPreOrder] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId) return;
    async function loadProduct() {
      const res = await fetch(`${API_URL}/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const product: ProductData | null = await res.json();
        if (!product) {
          toast.error(getMessage('product.not_found'));
          router.push('/catalog/products');
          return;
        }
        setName(product.name);
        setDescription(product.description ?? '');
        setPrice(String(product.price));
        setStatus(product.status);
        setAvailableOnline(product.availableOnline);
        setFeatured(product.featured);
        setAllowsPreOrder(product.allowsPreOrder);
      } else {
        toast.error(getMessage('product.not_found'));
        router.push('/catalog/products');
      }
      setLoading(false);
    }
    loadProduct();
  }, [productId, token, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const numericPrice = Number(price.replace(',', '.'));
      const body = {
        name,
        description: description.trim() === '' ? null : description.trim(),
        price: Number.isFinite(numericPrice) ? numericPrice : price,
        status,
        availableOnline,
        featured,
        allowsPreOrder,
      };

      const url = isEdit ? `${API_URL}/products/${productId}` : `${API_URL}/products`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 200 || res.status === 201) {
        toast.success(isEdit ? 'Produto atualizado com sucesso.' : 'Produto criado com sucesso.');
        router.push('/catalog/products');
        return;
      }

      const errorBody: ApiErrorResponse = await res.json();
      for (const code of errorBody.errors) toast.error(getMessage(code));
    } catch {
      toast.error(getMessage('DEFAULT_API_ERROR'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Carregando…</div>;
  }

  return (
    <div className="space-y-8">
      <PageSectionHeader
        badge="Catálogo"
        title={isEdit ? 'Editar produto' : 'Novo produto'}
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <FormSectionLayout title="Dados básicos" description="Identificação e descrição do produto.">
          <div className="space-y-2">
            <Label htmlFor="product-name">Nome</Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Camiseta Básica"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-description">Descrição</Label>
            <Textarea
              id="product-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição detalhada do produto (opcional)"
              rows={4}
            />
          </div>
        </FormSectionLayout>

        <FormSectionLayout title="Preço e status" description="Valor cobrado e disponibilidade do produto.">
          <div className="space-y-2">
            <Label htmlFor="product-price">Preço</Label>
            <Input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Combobox
              options={STATUS_OPTIONS}
              value={status}
              onChange={(value) => setStatus(value as ProductStatus)}
              placeholder="Selecione o status"
            />
          </div>
        </FormSectionLayout>

        <FormSectionLayout
          title="Disponibilidade"
          description="Defina onde e como este produto será exibido."
          showDivider={false}
        >
          <div className="flex items-center gap-3">
            <Checkbox
              id="product-availableOnline"
              checked={availableOnline}
              onCheckedChange={(checked) => setAvailableOnline(checked === true)}
            />
            <Label htmlFor="product-availableOnline" className="cursor-pointer">
              Disponível para venda online
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="product-featured"
              checked={featured}
              onCheckedChange={(checked) => setFeatured(checked === true)}
            />
            <Label htmlFor="product-featured" className="cursor-pointer">
              Produto em destaque
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="product-allowsPreOrder"
              checked={allowsPreOrder}
              onCheckedChange={(checked) => setAllowsPreOrder(checked === true)}
            />
            <Label htmlFor="product-allowsPreOrder" className="cursor-pointer">
              Aceita pré-venda
            </Label>
          </div>
        </FormSectionLayout>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/catalog/products')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar produto'}
          </Button>
        </div>
      </form>
    </div>
  );
}
