import { useEffect, useState } from 'react';

/**
 * Copy for unusually long first-contact requests (Render cold start).
 * Do not use for ordinary short API calls.
 */
export function useServerWakeCopy(busy: boolean): string | null {
  const [copy, setCopy] = useState<string | null>(null);

  useEffect(() => {
    if (!busy) {
      setCopy(null);
      return;
    }
    setCopy('Connecting to AutoHelp…');
    const timer = setTimeout(() => {
      setCopy('Server is waking up. This may take a moment.');
    }, 8000);
    return () => clearTimeout(timer);
  }, [busy]);

  return copy;
}
