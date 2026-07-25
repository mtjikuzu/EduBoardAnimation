/**
 * Excalidraw MCP Server — bridges the Excalidraw canvas to AI agents.
 *
 * The MCP server runs as a subprocess and exposes tools that let an LLM
 * create, modify, and delete Excalidraw elements. This enables the
 * conversational revision agent to draw on the canvas directly.
 *
 * Usage in the chat revision agent:
 *   const result = await callMcpTool('create_rectangle', { x, y, width, height })
 *
 * The MCP server syncs with the Excalidraw scene via WebSocket or file.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import { logger } from "../lib/logger";

let mcpProcess: ChildProcess | null = null;

const MCP_SERVER_PATH = resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "node_modules",
  "excalidraw-mcp",
  "dist",
  "index.js",
);

export interface McpToolCall {
  tool: string;
  args: Record<string, unknown>;
}

export interface McpToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Start the Excalidraw MCP server as a subprocess.
 * The server listens on a configurable port (default 3100) for JSON-RPC calls.
 */
export function startMcpServer(): void {
  if (mcpProcess) {
    logger.info("MCP server already running");
    return;
  }

  const port = process.env["EXCALIDRAW_MCP_PORT"] ?? "3100";

  logger.info({ port, path: MCP_SERVER_PATH }, "Starting Excalidraw MCP server");

  mcpProcess = spawn("node", [MCP_SERVER_PATH, "--port", port], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });

  mcpProcess.stdout?.on("data", (data: Buffer) => {
    logger.debug({ msg: data.toString().trim() }, "MCP server stdout");
  });

  mcpProcess.stderr?.on("data", (data: Buffer) => {
    logger.warn({ msg: data.toString().trim() }, "MCP server stderr");
  });

  mcpProcess.on("exit", (code) => {
    logger.info({ code }, "MCP server exited");
    mcpProcess = null;
  });
}

/**
 * Stop the MCP server.
 */
export function stopMcpServer(): void {
  if (mcpProcess) {
    mcpProcess.kill();
    mcpProcess = null;
  }
}

/**
 * Call an MCP tool on the Excalidraw server.
 */
export async function callMcpTool(tool: string, args: Record<string, unknown>): Promise<McpToolResult> {
  try {
    const port = process.env["EXCALIDRAW_MCP_PORT"] ?? "3100";
    const response = await fetch(`http://localhost:${port}/tools/${tool}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, error: `MCP tool ${tool} failed: ${text.slice(0, 200)}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: `MCP connection error: ${err}` };
  }
}

/**
 * List available MCP tools.
 */
export async function listMcpTools(): Promise<string[]> {
  try {
    const port = process.env["EXCALIDRAW_MCP_PORT"] ?? "3100";
    const response = await fetch(`http://localhost:${port}/tools`, {
      method: "GET",
    });

    if (!response.ok) return [];

    const data = (await response.json()) as { tools?: Array<{ name: string }> };
    return data.tools?.map((t) => t.name) ?? [];
  } catch {
    return [];
  }
}
