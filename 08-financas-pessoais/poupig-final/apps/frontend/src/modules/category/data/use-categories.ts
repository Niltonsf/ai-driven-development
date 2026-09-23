'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/shared/i18n';
import { useAuth } from '@/modules/auth/data/auth.context';
import {
  type CategoryDTO,
  type SaveCategoryInput,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  applyDefaultCategories,
} from './category-api.client';

export type ActionResult = { ok: true } | { ok: false; error: string };

function failure(error: unknown, fallbackCode: string): ActionResult {
  return { ok: false, error: getErrorMessage(error ?? fallbackCode) };
}

export function useCategories() {
  const { token } = useAuth();
  const [items, setItems] = useState<CategoryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listCategories(token);
      setItems(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, isLoading, error, refresh };
}

export function useSaveCategory() {
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const save = useCallback(
    async (input: SaveCategoryInput, id?: string): Promise<ActionResult> => {
      if (!token) return { ok: false, error: getErrorMessage('UNAUTHORIZED') };
      setIsSubmitting(true);
      try {
        if (id) {
          await updateCategory(token, id, input);
        } else {
          await createCategory(token, input);
        }
        return { ok: true };
      } catch (err: unknown) {
        return failure(err, 'CATEGORY_CREATE_ERROR');
      } finally {
        setIsSubmitting(false);
      }
    },
    [token],
  );

  return { save, isSubmitting };
}

export function useDeleteCategory() {
  const { token } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const remove = useCallback(
    async (id: string): Promise<ActionResult> => {
      if (!token) return { ok: false, error: getErrorMessage('UNAUTHORIZED') };
      setIsDeleting(true);
      try {
        await deleteCategory(token, id);
        return { ok: true };
      } catch (err: unknown) {
        return failure(err, 'CATEGORY_DELETE_ERROR');
      } finally {
        setIsDeleting(false);
      }
    },
    [token],
  );

  return { remove, isDeleting };
}

export function useApplyDefaultCategories() {
  const { token } = useAuth();
  const [isApplying, setIsApplying] = useState(false);

  const applyDefaults = useCallback(async (): Promise<ActionResult> => {
    if (!token) return { ok: false, error: getErrorMessage('UNAUTHORIZED') };
    setIsApplying(true);
    try {
      await applyDefaultCategories(token);
      return { ok: true };
    } catch (err: unknown) {
      return failure(err, 'CATEGORY_CREATE_BATCH_ERROR');
    } finally {
      setIsApplying(false);
    }
  }, [token]);

  return { applyDefaults, isApplying };
}
