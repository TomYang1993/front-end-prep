import { useEffect, useState } from 'react';

export function useLazyFetch<T>(enabled: boolean, url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled || loaded || loading) return;
    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then(setData)
      .finally(() => {
        setLoading(false);
        setLoaded(true);
      });
  }, [enabled, url, loaded, loading]);

  return { data, loading, loaded };
}
