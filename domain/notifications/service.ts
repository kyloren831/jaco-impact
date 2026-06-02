import { prisma } from '@/lib/prisma';
import { NotificationType } from '../../generated/prisma/enums';
import { domainEventBus } from '../shared/domain-event-bus';
import { DOMAIN_EVENTS, NotificationCreatedPayload } from '../shared/events';

export class NotificationService {
  async createNotification(data: {
    userId: number;
    title: string;
    message: string;
    type: NotificationType;
    relatedEntityType?: string;
    relatedEntityId?: string;
    actionUrl?: string;
  }) {
    const notification = await prisma.notification.create({
      data
    });

    await domainEventBus.emit<NotificationCreatedPayload>({
      type: DOMAIN_EVENTS.NOTIFICATION_CREATED,
      payload: {
        notificationId: notification.id,
        recipientId: notification.userId,
        type: notification.type,
        title: notification.title
      },
      metadata: {
        timestamp: new Date(),
        actorId: 0, // system
      }
    });

    return notification;
  }

  async markAsRead(notificationId: number, userId: number) {
    return prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: number) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
  }

  async getNotifications(userId: number, limit = 50) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}
