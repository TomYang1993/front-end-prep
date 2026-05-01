import { useEffect, useState } from 'react';

interface FetchState<T> {
  url: string | null;
  data: T | null;
  error: Error | null;
}

export function useFetch<T>(url: string) {
  const [state, setState] = useState<FetchState<T>>({ url: null, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<T>;
      })
      .then((d) => {
        if (!cancelled) setState({ url, data: d, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ url, data: null, error: err instanceof Error ? err : new Error(String(err)) });
        }
      });

    return () => { cancelled = true; };
  }, [url]);

  const isCurrent = state.url === url;
  return {
    data: isCurrent ? state.data : null,
    error: isCurrent ? state.error : null,
    loading: !isCurrent,
  };
}
