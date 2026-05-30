import { NotificationRoute } from '../api/integrationTypes';

export type PushForegroundEvent = {
  title: string;
  body: string;
  route: NotificationRoute | null;
};

type PushListener = (event: PushForegroundEvent) => void;
type RefreshListener = () => void;

const pushListeners = new Set<PushListener>();
const refreshListeners = new Set<RefreshListener>();

export function subscribePushForeground(listener: PushListener): () => void {
  pushListeners.add(listener);
  return () => pushListeners.delete(listener);
}

export function emitPushForeground(event: PushForegroundEvent): void {
  pushListeners.forEach((listener) => listener(event));
}

export function subscribeNotificationsRefresh(listener: RefreshListener): () => void {
  refreshListeners.add(listener);
  return () => refreshListeners.delete(listener);
}

export function emitNotificationsRefresh(): void {
  refreshListeners.forEach((listener) => listener());
}
