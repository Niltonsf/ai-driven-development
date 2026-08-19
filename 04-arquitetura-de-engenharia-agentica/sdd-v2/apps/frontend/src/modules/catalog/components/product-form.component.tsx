'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { FormSectionLayout } from '@/shared/components/ui/form-section-layout';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { getMessage } from '@/shared/i18n';
import { cn } from '@/shared/lib/class-name.util';
import {
  createProduct,
  PRODUCT_STATUSES,
  ProductsApiError,
  type ProductStatus,
  type ProductSummary,
  updateProduct,
} from '../util/products-api.util';

type Mode = 'create' | 'edit';

type ProductFormProps = {
  mode: Mode;
  initialProduct?: ProductSummary;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ProductForm({ mode, initialProduct, onSuccess, onCancel }: ProductFormProps) {
  const [name, setName] = useState(initialProduct?.name ?? '');
  const [description, setDescription] = useState(initialProduct?.description ?? '');
  const [price, setPrice] = useState<string>(
    initialProduct ? String(initialProduct.price) : '',
  );
  const [status, setStatus] = useState<ProductStatus>(initialProduct?.status ?? 'draft');
  const [availableOnline, setAvailableOnline] = useState(initialProduct?.availableOnline ?? false);
  const [featured, setFeatured] = useState(initialProduct?.featured ?? false);
  const [allowsPreOrder, setAllowsPreOrder] = useState(initialProduct?.allowsPreOrder ?? false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice)) {
      toast.error(getMessage('product.price.required'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        description: description.trim() === '' ? null : description.trim(),
        price: parsedPrice,
        status,
        availableOnline,
        featured,
        allowsPreOrder,
      };

      if (mode === 'edit' && initialProduct) {
        await updateProduct(initialProduct.id, payload);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await createProduct(payload);
        toast.success('Produto criado com sucesso!');
      }
      onSuccess();
    } catch (error) {
      if (error instanceof ProductsApiError) {
        for (const code of error.errors) {
          toast.error(getMessage(code));
        }
      } else {
        toast.error(getMessage('DEFAULT_API_ERROR'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FormSectionLayout title="Dados básicos" description="Identificação do produto no catálogo.">
        <div>
          <Label htmlFor="product-form-name">Nome</Label>
          <Input
            id="product-form-name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Camiseta Branca"
          />
        </div>
        <div>
          <Label htmlFor="product-form-description">Descrição</Label>
          <Textarea
            id="product-form-description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descreva o produto (opcional)"
          />
        </div>
      </FormSectionLayout>

      <FormSectionLayout title="Preço e status" description="Defina o preço e a disponibilidade do produto.">
        <div>
          <Label htmlFor="product-form-price">Preço</Label>
          <Input
            id="product-form-price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="product-form-status">Status</Label>
          <select
            id="product-form-status"
            name="status"
            required
            value={status}
            onChange={(event) => setStatus(event.target.value as ProductStatus)}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {PRODUCT_STATUSES.map((option) => (
              <option key={option} value={option}>
                {getMessage(`product.status.${option}`)}
              </option>
            ))}
          </select>
        </div>
      </FormSectionLayout>

      <FormSectionLayout
        title="Disponibilidade"
        description="Configure como o produto aparece para o cliente."
        showDivider={false}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            id="product-form-available-online"
            checked={availableOnline}
            onCheckedChange={(checked) => setAvailableOnline(checked === true)}
          />
          <Label htmlFor="product-form-available-online" className="cursor-pointer">
            Disponível online
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="product-form-featured"
            checked={featured}
            onCheckedChange={(checked) => setFeatured(checked === true)}
          />
          <Label htmlFor="product-form-featured" className="cursor-pointer">
            Em destaque
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="product-form-allows-pre-order"
            checked={allowsPreOrder}
            onCheckedChange={(checked) => setAllowsPreOrder(checked === true)}
          />
          <Label htmlFor="product-form-allows-pre-order" className="cursor-pointer">
            Aceita pré-venda
          </Label>
        </div>
      </FormSectionLayout>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
