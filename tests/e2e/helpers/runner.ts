import { spawn, ChildProcess } from "child_process";
import http from "http";

export class DevServerManager {
  private proc: ChildProcess | null = null;
  private port: number;

  constructor(port: number = 3005) {
    this.port = port;
  }

  async start(): Promise<void> {
    console.log(`Starting next dev server on port ${this.port}...`);
    
    // Spawn npx next dev -p 3005
    this.proc = spawn("npx", ["next", "dev", "-p", String(this.port)], {
      env: {
        ...process.env,
        PORT: String(this.port),
        // Ensure Next.js doesn't open browser, etc.
      },
      stdio: "pipe",
      shell: true,
    });

    this.proc.stdout?.on("data", (data) => {
      // console.log(`[Next.js stdout] ${data}`);
    });

    this.proc.stderr?.on("data", (data) => {
      // console.error(`[Next.js stderr] ${data}`);
    });

    await this.waitForServer();
    console.log(`Next dev server is ready on port ${this.port}.`);
  }

  private waitForServer(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const req = http.get(`http://localhost:${this.port}/api/auth/me`, (res) => {
          clearInterval(interval);
          resolve();
        });
        req.on("error", () => {
          // keep polling until ready
        });
      }, 200);
    });
  }

  async triggerCompilation(): Promise<void> {
    console.log("Triggering route compilation via /test-actions...");
    return new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${this.port}/test-actions`, (res) => {
        res.on("data", () => {});
        res.on("end", () => {
          console.log("Compilation triggered successfully.");
          resolve();
        });
      });
      req.on("error", (err) => {
        reject(new Error(`Failed to hit /test-actions: ${err.message}`));
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.proc) return;
    console.log("Stopping next dev server...");
    
    return new Promise((resolve) => {
      // We can kill the process using process group or sending SIGTERM
      // Under node, spawn with shell: true runs process under a shell.
      // So proc.kill() might kill the shell, not the next dev server.
      // Therefore, let's kill the child processes as well by checking port 3005.
      // Or we can just kill the proc and use pkill if it is linux.
      // In Linux, we can kill by command line, but first let's try SIGTERM.
      this.proc?.kill("SIGTERM");
      
      const checkInterval = setInterval(() => {
        if (this.proc?.killed) {
          clearInterval(checkInterval);
          this.proc = null;
          resolve();
        }
      }, 100);

      // Force cleanup using a child process shell command if needed
      setTimeout(() => {
        clearInterval(checkInterval);
        try {
          // Kill whatever is running on port 3005
          const { execSync } = require("child_process");
          try {
            execSync(`npx kill-port ${this.port}`);
          } catch (e) {}
        } catch (e) {}
        this.proc = null;
        resolve();
      }, 2000);
    });
  }
}
