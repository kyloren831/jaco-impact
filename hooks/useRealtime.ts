'use client';

import { useEffect, useState, useRef } from 'react';

type RealtimeEvent<T = any> = {
  type: string;
  metadata?: any;
  payload: T;
};

export function useRealtime<T = any>(
  eventType?: string,
  onEvent?: (event: RealtimeEvent<T>) => void
) {
  const [lastEvent, setLastEvent] = useState<RealtimeEvent<T> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    const eventSource = new EventSource('/api/realtime');

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      // EventSource will automatically attempt to reconnect
    };

    eventSource.onmessage = (event) => {
      try {
        const parsedEvent: RealtimeEvent<T> = JSON.parse(event.data);
        
        if (!eventType || parsedEvent.type === eventType) {
          setLastEvent(parsedEvent);
          if (callbackRef.current) {
            callbackRef.current(parsedEvent);
          }
        }
      } catch (err) {
        console.error('Failed to parse realtime event data:', err);
      }
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [eventType]);

  return { lastEvent, isConnected };
}
