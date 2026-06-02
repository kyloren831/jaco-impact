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
          const data = `data: ${JSON.stringify(event)}\n\n`;
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
