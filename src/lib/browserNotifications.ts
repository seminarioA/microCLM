/** Notificaciones reales del navegador (Web Notifications API), no solo la campanita interna de la app. */

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | null {
  if (!isNotificationSupported()) return null;
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (!isNotificationSupported()) return null;
  return Notification.requestPermission();
}

export function showBrowserNotification(title: string, body: string): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/vite.svg" });
}
