import { HexColor, Text } from '@poupig/shared';
import { v } from '@/shared/components/form/validator';

export const creditCardSchema = v.defineObject({
  name: Text,
  brand: Text,
  closingDay: Text,
  dueDay: Text,
  description: { vo: Text, optional: true },
  lastFourDigits: { vo: Text, optional: true },
  limit: { vo: Text, optional: true },
  color: { vo: HexColor, optional: true },
  icon: { vo: Text, optional: true },
});

export type CreditCardFormData = v.infer<typeof creditCardSchema> & { isActive?: boolean };
