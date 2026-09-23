import { HexColor, Text } from '@poupig/shared';
import { CategoryName, SubcategoryName } from '@poupig/category';
import { v } from '@/shared/components/form/validator';

export const categorySchema = v.defineObject({
  name: CategoryName,
  icon: { vo: Text, optional: true },
  color: { vo: HexColor, optional: true },
  subcategories: v.defineArray(
    {
      name: SubcategoryName,
      icon: { vo: Text, optional: true },
      color: { vo: HexColor, optional: true },
    },
    { optional: true },
  ),
});

/**
 * Campos de controle que não são validados por Value Object e por isso não fazem
 * parte do schema: o resolver descarta tudo que não está declarado acima, então o
 * payload enviado à API é montado a partir de `form.getValues()`, não do resultado
 * do resolver. Ver `category-form.component.tsx`.
 */
export type SubcategoryFormItem = {
  id?: string;
  name: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  order: number;
};

export type CategoryFormData = Omit<v.infer<typeof categorySchema>, 'subcategories'> & {
  isActive: boolean;
  subcategories: SubcategoryFormItem[];
};
