import { useCallback, useEffect, useState } from 'react';
import {
  ensureWatchedHelpRequestsLoaded,
  isHelpRequestWatched,
  resolveHelpRequestWatchedState,
  setHelpRequestWatched,
  subscribeHelpRequestWatch,
} from '../services/helpRequestWatch';

export function useHelpRequestWatch(helpRequestId: string, initialFromApi?: boolean) {
  const [watched, setWatched] = useState(() =>
    resolveHelpRequestWatchedState(helpRequestId, initialFromApi),
  );
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void ensureWatchedHelpRequestsLoaded()
      .then(() => {
        if (!cancelled) {
          setWatched(resolveHelpRequestWatchedState(helpRequestId, initialFromApi));
        }
      })
      .catch(() => {
        /* keep optimistic/local state */
      });

    const unsubscribe = subscribeHelpRequestWatch(() => {
      if (!cancelled) {
        setWatched(isHelpRequestWatched(helpRequestId));
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [helpRequestId, initialFromApi]);

  const toggleWatch = useCallback(async () => {
    if (!helpRequestId || toggling) return;
    const next = !watched;
    setWatched(next);
    setToggling(true);
    try {
      await setHelpRequestWatched(helpRequestId, next);
    } catch {
      setWatched(!next);
      throw new Error(next ? 'Не удалось добавить в избранное' : 'Не удалось убрать из избранного');
    } finally {
      setToggling(false);
    }
  }, [helpRequestId, toggling, watched]);

  return { watched, toggling, toggleWatch };
}
