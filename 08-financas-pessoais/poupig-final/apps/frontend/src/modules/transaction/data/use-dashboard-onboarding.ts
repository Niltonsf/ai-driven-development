'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/modules/auth/data/auth.context';
import { listAccounts } from '@/modules/account/data/account-api.client';
import { listCategories } from '@/modules/category/data/category-api.client';

export type DashboardOnboardingStatus = 'loading' | 'ready' | 'unavailable';

export type DashboardOnboarding = {
  status: DashboardOnboardingStatus;
  hasAccounts: boolean;
  hasActiveCategories: boolean;
};

/**
 * Result of the reading done for the token in `token`. Loading is derived by
 * comparing it with the current token, so no state is written synchronously
 * inside the effect.
 */
type OnboardingState = {
  token: string | null;
  status: Exclude<DashboardOnboardingStatus, 'loading'>;
  hasAccounts: boolean;
  hasActiveCategories: boolean;
};

const INITIAL_ONBOARDING_STATE: OnboardingState = {
  token: null,
  status: 'unavailable',
  hasAccounts: false,
  hasActiveCategories: false,
};

/**
 * Whether the user already has the base registrations (an account and an active
 * category), read once per token. It only feeds a help guide: any failure turns
 * into `unavailable`, with no message on screen.
 */
export function useDashboardOnboarding(): DashboardOnboarding {
  const { token } = useAuth();
  const [state, setState] = useState<OnboardingState>(INITIAL_ONBOARDING_STATE);

  useEffect(() => {
    if (!token) return;
    let isCurrent = true;

    Promise.all([listAccounts(token, 1, 1), listCategories(token)])
      .then(([accounts, categories]) => {
        if (!isCurrent) return;
        setState({
          token,
          status: 'ready',
          hasAccounts: accounts.total > 0,
          hasActiveCategories: categories.some((category) => category.isActive),
        });
      })
      .catch(() => {
        if (isCurrent) setState({ ...INITIAL_ONBOARDING_STATE, token, status: 'unavailable' });
      });

    // A new token (or unmount) makes this response obsolete.
    return () => {
      isCurrent = false;
    };
  }, [token]);

  if (!token || state.token !== token) {
    return { status: 'loading', hasAccounts: false, hasActiveCategories: false };
  }

  return { status: state.status, hasAccounts: state.hasAccounts, hasActiveCategories: state.hasActiveCategories };
}
