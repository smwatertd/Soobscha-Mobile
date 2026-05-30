import { useEffect, useState } from 'react';
import {
  ensureWatchedHelpRequestsLoaded,
  getWatchedHelpRequestsCount,
  subscribeHelpRequestWatch,
} from '../services/helpRequestWatch';

export function useWatchedHelpRequestsCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      if (!cancelled) setCount(getWatchedHelpRequestsCount());
    };

    void ensureWatchedHelpRequestsLoaded().then(refresh).catch(() => {});
    const unsubscribe = subscribeHelpRequestWatch(refresh);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return count;
}
