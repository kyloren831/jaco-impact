import test from "node:test";
import assert from "node:assert";
import { spawn } from "child_process";
import http from "http";
import path from "path";
import fs from "fs";
import { signAccessToken } from "../../lib/auth/jwt";

// ── Environment Variables Loader ───────────────────────────────────
function loadEnv() {
  const loadFile = (filename: string) => {
    try {
      const envPath = path.join(process.cwd(), filename);
      if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, "utf8");
        envConfig.split("\n").forEach((line) => {
          const match = line.match(/^([^#]+?)=(.*)$/);
          if (match) {
            process.env[match[1].trim()] = match[2].trim().replace(/(^"|"$)/g, "");
          }
        });
      }
    } catch (e) {
      console.error(`Failed to load ${filename}:`, e);
    }
  };
  loadFile(".env");
  loadFile(".env.local");
}

loadEnv();

// ── HTTP Helper ───────────────────────────────────────────────────
function makeRequest(port: number, token?: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const options: http.RequestOptions = {
      hostname: "localhost",
      port,
      path: "/api/auth/me",
      method: "GET",
      headers: token ? { Cookie: `access_token=${token}` } : {},
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode || 0,
            body: JSON.parse(data),
          });
        } catch {
          resolve({
            status: res.statusCode || 0,
            body: data,
          });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.end();
  });
}

// ── Wait for Server ───────────────────────────────────────────────
function waitForServer(port: number, timeoutMs = 15000): Promise<void> {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(new Error("Timeout waiting for server to start"));
        return;
      }
      const req = http.get(`http://localhost:${port}/api/auth/me`, (res) => {
        clearInterval(interval);
        resolve();
      });
      req.on("error", () => {
        // Ignore and retry
      });
    }, 500);
  });
}

// ── Test Suite ────────────────────────────────────────────────────
test("E2E Feasibility Prototype Suite", async (t) => {
  const port = 3005; // Use a different port to avoid conflicts
  console.log(`Starting Next.js dev server on port ${port}...`);

  const nextBin = path.join(process.cwd(), "node_modules/.bin/next");
  const server = spawn(nextBin, ["dev", "-p", String(port)], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
  });

  server.stdout.on("data", (data) => {
    console.log(`[Next.js stdout]: ${data.toString().trim()}`);
  });

  server.stderr.on("data", (data) => {
    console.error(`[Next.js stderr]: ${data.toString().trim()}`);
  });

  // Ensure clean termination on exit
  const cleanup = () => {
    console.log("Stopping Next.js server...");
    server.kill("SIGTERM");
  };

  try {
    await t.test("Wait for server startup", async () => {
      await waitForServer(port);
      console.log("Server is up and responding!");
    });

    await t.test("Unauthenticated request should return 401", async () => {
      const response = await makeRequest(port);
      assert.strictEqual(response.status, 401);
      assert.deepStrictEqual(response.body, { user: null });
      console.log("Unauthenticated request test passed!");
    });

    await t.test("Authenticated request with signed JWT should return 200", async () => {
      const payload = {
        sub: 999,
        email: "e2e-test-user@jacoimpact.com",
        role: "ADMIN",
        roles: ["ADMIN"],
      };

      const token = await signAccessToken(payload);
      const response = await makeRequest(port, token);

      assert.strictEqual(response.status, 200);
      assert.ok(response.body.user);
      assert.strictEqual(response.body.user.id, "999"); // stringified by jose setSubject
      assert.strictEqual(response.body.user.email, payload.email);
      assert.strictEqual(response.body.user.role, payload.role);
      assert.deepStrictEqual(response.body.user.roles, payload.roles);
      console.log("Authenticated request test passed!");
    });

  } finally {
    cleanup();
  }
});
