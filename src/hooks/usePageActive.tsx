import { createContext, useContext, useEffect, useState } from 'react';

/**
 * Tells a screen whether it is currently the ACTIVE (visible) page.
 *
 * Two conditions must hold:
 *  1. The keep-alive route layer this screen is mounted in is the visible one
 *     (AnimatedOutlet in App.tsx marks each layer via PageActiveProvider).
 *  2. The browser tab/document is visible — the user is actually looking at it.
 *
 * Polling screens should gate their intervals on this so hidden or
 * backgrounded pages never keep calling APIs.
 */
export const PageActiveContext = createContext(true);

export function usePageActive(): boolean {
  const layerActive = useContext(PageActiveContext);

  const [documentVisible, setDocumentVisible] = useState(
    () => document.visibilityState === 'visible',
  );

  useEffect(() => {
    const handleVisibility = () => {
      setDocumentVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return layerActive && documentVisible;
}
