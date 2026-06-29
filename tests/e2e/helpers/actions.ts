import fs from "fs";
import path from "path";

function findActionIdInObj(obj: any, actionName: string): string | null {
  if (!obj || typeof obj !== "object") return null;
  if (obj.name === actionName && typeof obj.id === "string") {
    return obj.id;
  }
  for (const key of Object.keys(obj)) {
    const res = findActionIdInObj(obj[key], actionName);
    if (res) return res;
  }
  return null;
}

function findActionId(manifest: any, actionName: string): string | null {
  for (const group of ["node", "edge"]) {
    const actionsGroup = manifest[group];
    if (actionsGroup && typeof actionsGroup === "object") {
      for (const [actionId, actionData] of Object.entries(actionsGroup)) {
        if (actionData && typeof actionData === "object") {
          if (
            (actionData as any).exportedName === actionName ||
            (actionData as any).name === actionName
          ) {
            return actionId;
          }
          const workers = (actionData as any).workers;
          if (workers && typeof workers === "object") {
            for (const workerData of Object.values(workers)) {
              if (workerData && typeof workerData === "object") {
                if (
                  (workerData as any).exportedName === actionName ||
                  (workerData as any).name === actionName
                ) {
                  return (workerData as any).id || actionId;
                }
              }
            }
          }
        }
      }
    }
  }
  return findActionIdInObj(manifest, actionName);
}

export function getActionId(actionName: string): string {
  const devManifestPath = path.resolve(process.cwd(), ".next/dev/server/server-reference-manifest.json");
  const prodManifestPath = path.resolve(process.cwd(), ".next/server/server-reference-manifest.json");
  const manifestPath = fs.existsSync(devManifestPath) ? devManifestPath : prodManifestPath;

  if (!fs.existsSync(manifestPath)) {
    throw new Error(`server-reference-manifest.json not found at ${manifestPath}. Make sure next dev server is running and the compilation page has been loaded.`);
  }
  const content = fs.readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(content);
  const actionId = findActionId(manifest, actionName);
  if (!actionId) {
    throw new Error(`Action '${actionName}' not found in server-reference-manifest.json`);
  }
  return actionId;
}

function findActionResult(obj: any): any | null {
  if (!obj || typeof obj !== "object") return null;
  if (typeof obj.success === "boolean") {
    return obj;
  }
  for (const key of Object.keys(obj)) {
    const res = findActionResult(obj[key]);
    if (res) return res;
  }
  return null;
}

export async function executeAction(
  actionName: string,
  args: any[],
  cookie?: string
): Promise<any> {
  const actionId = getActionId(actionName);
  const headers: Record<string, string> = {
    "Next-Action": actionId,
  };
  if (cookie) {
    headers["Cookie"] = cookie;
  }

  if (actionName === "submitEvidenceAction" && args.length === 1 && args[0] && typeof args[0] === "object" && typeof args[0].get === "function") {
    const formData = args[0];
    const taskIdStr = formData.get("taskId");
    const file = formData.get("file");
    const descriptionStr = formData.get("description");
    if (taskIdStr && file) {
      args[0] = {
        taskId: parseInt(taskIdStr.toString(), 10),
        description: descriptionStr ? descriptionStr.toString() : undefined,
        file: {
          name: file.name,
          type: file.type,
          size: file.size || 0,
        }
      };
    }
  }

  console.log("[DEBUG executeAction] action:", actionName, "args length:", args.length, "args[0] type:", typeof args[0], "constructor:", args[0]?.constructor?.name);
  let body: any;
  if (args.length === 1 && args[0] && typeof args[0] === "object" && typeof args[0].append === "function") {
    console.log("[DEBUG executeAction] serializing FormData");
    const serializationResponse = new Response(args[0]);
    const arrayBuffer = await serializationResponse.arrayBuffer();
    body = Buffer.from(arrayBuffer);
    console.log("[DEBUG executeAction] serialized body length:", body.length);
    headers["Content-Type"] = serializationResponse.headers.get("content-type") || "";
  } else {
    headers["Content-Type"] = "text/plain;charset=UTF-8";
    body = JSON.stringify(args);
  }

  const response = await fetch("http://localhost:3005/", {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Server Action ${actionName} failed: HTTP ${response.status} - ${text}`);
  }

  const text = await response.text();
  
  // Try direct JSON first
  try {
    return JSON.parse(text);
  } catch (e) {
    // Split lines and search for action result in RSC streams
    const lines = text.split("\n");
    for (const line of lines) {
      const colIdx = line.indexOf(":");
      if (colIdx !== -1) {
        const content = line.substring(colIdx + 1);
        try {
          const parsed = JSON.parse(content);
          const result = findActionResult(parsed);
          if (result) return result;
        } catch (err) {
          // ignore parse errors of partial lines
        }
      }
    }

    // Fallback regex search for {"success":...}
    const match = text.match(/\{"success":(?:[^{}]|\{[^{}]*\})*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (err) {}
    }
  }

  return { success: false, error: `Could not parse server action response. Raw response: ${text}` };
}
