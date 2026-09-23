import { useSelectedMonthContext } from '@/shared/context/selected-month.context';

export function useSelectedMonth() {
  return useSelectedMonthContext();
}
