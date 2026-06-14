export class SSEClient {
  private events: any[] = [];
  private controller: AbortController | null = null;
  private url: string;

  constructor(url: string = "http://localhost:3005/api/realtime") {
    this.url = url;
  }

  async connect(): Promise<void> {
    this.controller = new AbortController();
    const response = await fetch(this.url, {
      signal: this.controller.signal,
    });

    if (!response.body) {
      throw new Error("No response body from SSE stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // Start background streaming reader loop
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:")) {
              const dataContent = trimmed.slice(5).trim();
              try {
                const parsed = JSON.parse(dataContent);
                this.events.push(parsed);
              } catch (e) {
                // Ignore parse errors (e.g. heartbeat or partial chunks)
              }
            }
          }
        }
      } catch (err) {
        // quiet fail on abort
      }
    })();
  }

  getEvents(): any[] {
    return this.events;
  }

  clearEvents(): void {
    this.events = [];
  }

  close(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }
}
