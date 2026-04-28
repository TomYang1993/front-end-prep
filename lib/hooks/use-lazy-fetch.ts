import { useEffect, useState } from 'react';

export function useLazyFetch<T>(enabled: boolean, url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || loaded) return;
    let cancelled = false;
    fetch(url)
      .then((res) => res.json())
      .then((d) => { if (!cancelled) setData(d); })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [enabled, url, loaded]);

  return { data, loading: enabled && !loaded, loaded };
}
