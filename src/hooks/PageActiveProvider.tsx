import type { ReactNode } from 'react';
import { PageActiveContext } from '@/hooks/usePageActive';

export function PageActiveProvider({ active, children }: { active: boolean; children: ReactNode }) {
  return <PageActiveContext.Provider value={active}>{children}</PageActiveContext.Provider>;
}
