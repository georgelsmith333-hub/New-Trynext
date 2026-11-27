export interface LocalNotification {
  id: string;
  type: "order" | "message" | "system";
  title: string;
  message: string;
  createdAt: string;
  link?: string;
  read: boolean;
}

const STORAGE_KEY = "trynext_local_notifications_v1";
const EVENT_NAME = "trynext-local-notifications-changed";
const MAX_NOTIFICATIONS = 30;

function read(): LocalNotification[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(notifications: LocalNotification[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {
    // Private browsing or storage limits must not break checkout.
  }
}

export function getLocalNotifications(): LocalNotification[] {
  return read();
}

export function addLocalNotification(notification: Omit<LocalNotification, "id" | "createdAt" | "read">): void {
  const next: LocalNotification = {
    ...notification,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };
  write([next, ...read()]);
}

export function markLocalNotificationsRead(): void {
  const notifications = read();
  if (!notifications.some((notification) => !notification.read)) return;
  write(notifications.map((notification) => ({ ...notification, read: true })));
}

export function subscribeToLocalNotifications(listener: () => void): () => void {
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
