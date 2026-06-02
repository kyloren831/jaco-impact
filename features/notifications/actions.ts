'use server'

import { requireAuth } from '@/lib/auth/guards';
import { NotificationService } from '@/domain/notifications/service';
import { initializeDomainEvents } from "@/domain/shared/init";
initializeDomainEvents();

const notificationService = new NotificationService();

export async function markAsRead(notificationId: number) {
  const user = await requireAuth();
  await notificationService.markAsRead(notificationId, Number(user.id));
}

export async function markAllAsRead() {
  const user = await requireAuth();
  await notificationService.markAllAsRead(Number(user.id));
}

export async function getNotifications(limit = 50) {
  const user = await requireAuth();
  return notificationService.getNotifications(Number(user.id), limit);
}
