import { DevServerManager } from "./helpers/runner";
import { resetAndSeed } from "./helpers/db";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

async function main() {
  console.log("=== STARTING E2E TEST SUITE ORCHESTRATION ===");
  process.env.NODE_ENV = "test";
  process.env.MOCK_S3 = "true";

  let devServer: DevServerManager | null = null;
  let exitCode = 0;

  try {
    // 1. Write the temporary compiler page dynamically before starting next server
    const tempDir = path.resolve(process.cwd(), "app/test-actions");
    const tempPagePath = path.resolve(tempDir, "page.tsx");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const compilerPageContent = `import {
  registerToEventAction,
  getVolunteerTasksAction,
  acceptAssignmentAction,
  declineAssignmentAction,
  startAssignmentAction,
  submitAssignmentAction,
  addTaskCommentAction,
  getTaskCommentsAction
} from "@/features/volunteer/actions";

import {
  submitEvidenceAction,
  reviewEvidenceAction,
  getPresignedUploadUrlAction
} from "@/features/evidences/actions";

import {
  createEvent,
  cancelEventAction,
  updateEventStatusAction,
  updateEventDetailsAction,
  getEventsByProject,
  getAllEvents,
  getEventDetail
} from "@/features/events/actions";

import {
  createTaskAction,
  assignVolunteerAction,
  removeVolunteerAction,
  getTasksByEvent,
  updateTaskStatusAction,
  updateTaskDetailsAction,
  getAllVolunteersAction
} from "@/features/tasks/actions";

import { getActivityLogs } from "@/features/audit/actions";

export default function TestActionsPage() {
  const actions = {
    registerToEventAction,
    getVolunteerTasksAction,
    acceptAssignmentAction,
    declineAssignmentAction,
    startAssignmentAction,
    submitAssignmentAction,
    addTaskCommentAction,
    getTaskCommentsAction,
    submitEvidenceAction,
    reviewEvidenceAction,
    getPresignedUploadUrlAction,
    createEvent,
    cancelEventAction,
    updateEventStatusAction,
    updateEventDetailsAction,
    getEventsByProject,
    getAllEvents,
    getEventDetail,
    createTaskAction,
    assignVolunteerAction,
    removeVolunteerAction,
    getTasksByEvent,
    updateTaskStatusAction,
    updateTaskDetailsAction,
    getAllVolunteersAction,
    getActivityLogs
  };

  return (
    <div>
      <h1>Test Actions Compiler</h1>
      <pre>{JSON.stringify(Object.keys(actions), null, 2)}</pre>
    </div>
  );
}`;

    fs.writeFileSync(tempPagePath, compilerPageContent, "utf8");
    console.log(`Dynamically created temporary page at ${tempPagePath}`);

    // 2. Reset and seed DB first
    await resetAndSeed();

    // 3. Start Next.js dev server on port 3005
    devServer = new DevServerManager(3005);
    await devServer.start();

    // 4. Trigger compilation by hitting http://localhost:3005/test-actions
    await devServer.triggerCompilation();

    // 5. Run the spec files (tier1, tier2, tier3, tier4) using node:test runner via tsx
    console.log("Running E2E tests...");
    
    const specFiles = [
      "tests/e2e/specs/tier1.spec.ts",
      "tests/e2e/specs/tier2.spec.ts",
      "tests/e2e/specs/tier3.spec.ts",
      "tests/e2e/specs/tier4.spec.ts"
    ];

    const testProc = spawn("npx", ["tsx", "--test", ...specFiles], {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
        MOCK_S3: "true",
        PORT: "3005",
      },
      shell: true,
    });

    await new Promise<void>((resolve, reject) => {
      testProc.on("close", (code) => {
        if (code !== 0) {
          exitCode = code ?? 1;
          console.error(`E2E tests failed with exit code ${code}`);
        } else {
          console.log("All E2E tests completed successfully!");
        }
        resolve();
      });
      testProc.on("error", (err) => {
        reject(err);
      });
    });

  } catch (error) {
    console.error("Orchestrator error encountered:", error);
    exitCode = 1;
  } finally {
    // 6. Shutdown the Next dev server
    if (devServer) {
      await devServer.stop();
    }

    // 7. Clean up the temporary compiler page and empty directory
    const tempPagePath = path.resolve(process.cwd(), "app/test-actions/page.tsx");
    if (fs.existsSync(tempPagePath)) {
      console.log(`Cleaning up temporary page at ${tempPagePath}...`);
      try {
        fs.unlinkSync(tempPagePath);
        console.log("Temporary page cleaned up.");
      } catch (err: any) {
        console.error(`Failed to clean up temporary page: ${err.message}`);
      }
    }

    const tempDir = path.resolve(process.cwd(), "app/test-actions");
    if (fs.existsSync(tempDir)) {
      try {
        const files = fs.readdirSync(tempDir);
        if (files.length === 0) {
          fs.rmdirSync(tempDir);
          console.log("Temporary directory cleaned up.");
        }
      } catch (err: any) {
        console.error(`Failed to clean up temporary directory: ${err.message}`);
      }
    }

    console.log(`=== E2E SUITE FINISHED (Exit Code: ${exitCode}) ===`);
    process.exit(exitCode);
  }
}

main();
