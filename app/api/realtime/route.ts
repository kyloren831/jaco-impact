import { NextRequest } from "next/server";
import { domainEventBus } from "@/domain/shared/domain-event-bus";
import { DOMAIN_EVENTS } from "@/domain/shared/events";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      const sendEvent = (event: any) => {
        try {
          let outputEvent = event;
          if (event.type === DOMAIN_EVENTS.TASK_COMMENT) {
            outputEvent = {
              ...event,
              payload: {
                ...event.payload,
                comment: {
                  id: event.payload.commentId,
                  content: event.payload.content,
                  createdAt: event.payload.createdAt,
                  author: {
                    id: event.payload.authorId,
                    name: event.payload.authorName,
                  },
                },
              },
            };
          } else if (event.type === DOMAIN_EVENTS.ASSIGNMENT_STATUS_CHANGED) {
            outputEvent = {
              ...event,
              payload: {
                ...event.payload,
                taskId: event.payload.taskId,
                volunteerId: event.payload.volunteerId,
                newStatus: event.payload.newStatus,
              },
            };
          }
          const data = `data: ${JSON.stringify(outputEvent)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (e) {
          // Ignore write errors (e.g. client disconnected)
        }
      };

      // Register listener for all domain events
      const eventNames = Object.values(DOMAIN_EVENTS);
      for (const eventName of eventNames) {
        domainEventBus.on(eventName, sendEvent);
      }

      // Send a heartbeat every 30 seconds to keep connection alive
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        } catch (e) {
          clearInterval(interval);
        }
      }, 30000);

      // Clean up listeners when the client closes the connection
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        for (const eventName of eventNames) {
          domainEventBus.off(eventName, sendEvent);
        }
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
