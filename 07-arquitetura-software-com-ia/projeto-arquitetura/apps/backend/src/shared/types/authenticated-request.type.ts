import { Request } from 'express';
import { AuthenticatedUser } from '@arquitetura/shared';

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
