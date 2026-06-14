import { withTransaction } from "@/lib/prisma";
import { domainEventBus } from "../shared/domain-event-bus";
import { DOMAIN_EVENTS } from "../shared/events";

export class CommentService {
  async createComment(taskId: number, authorId: number, content: string) {
    if (!content.trim()) {
      throw new Error("El comentario no puede estar vacío");
    }

    return withTransaction(async (tx) => {
      // 1. Verify task exists
      const task = await tx.task.findUniqueOrThrow({
        where: { id: taskId },
        select: { eventId: true }
      });

      // 2. Persist the comment
      const comment = await tx.taskComment.create({
        data: {
          taskId,
          authorId,
          content,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            }
          }
        }
      });

      // 3. Emit Domain Event
      await domainEventBus.emit({
        metadata: { timestamp: new Date(), actorId: authorId },
        type: DOMAIN_EVENTS.TASK_COMMENT,
        payload: {
          taskId,
          commentId: comment.id,
          authorId,
          content: comment.content,
          createdAt: comment.createdAt,
          authorName: comment.author.name,
          eventId: task.eventId,
        }
      });

      return comment;
    });
  }

  async getCommentsByTaskId(taskId: number) {
    return withTransaction(async (tx) => {
      return tx.taskComment.findMany({
        where: { taskId },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              imageUrl: true,
            }
          }
        }
      });
    });
  }
}

export const commentService = new CommentService();
