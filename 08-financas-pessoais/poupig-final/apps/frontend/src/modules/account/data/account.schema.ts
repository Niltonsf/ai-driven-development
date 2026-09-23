import { HexColor, Text } from '@poupig/shared';
import { v } from '@/shared/components/form/validator';

export const accountSchema = v.defineObject({
  name: Text,
  type: Text,
  description: { vo: Text, optional: true },
  accountNumber: { vo: Text, optional: true },
  agency: { vo: Text, optional: true },
  financialInstitution: { vo: Text, optional: true },
  color: { vo: HexColor, optional: true },
  icon: { vo: Text, optional: true },
});

export type AccountFormData = v.infer<typeof accountSchema> & { isActive?: boolean };
