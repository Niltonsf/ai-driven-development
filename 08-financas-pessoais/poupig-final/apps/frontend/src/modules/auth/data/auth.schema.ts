import { Email, PersonName, StrongPassword } from '@poupig/shared';
import { v } from '@/shared/components/form/validator';

/**
 * Schema de registro: valida nome + e-mail + senha forte.
 */
export const registerSchema = v.defineObject({
  name: PersonName,
  email: Email,
  password: StrongPassword,
});

/**
 * Schema de login: valida apenas e-mail + senha.
 */
export const loginSchema = v.defineObject({
  email: Email,
  password: StrongPassword,
});

export type RegisterFormData = v.infer<typeof registerSchema>;
export type LoginFormData = v.infer<typeof loginSchema>;
