// Entry point 1: LOCAL server over stdio (Claude Desktop / Claude Code start this).
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

await createServer().connect(new StdioServerTransport());

// NOTE: use console.error for logs, NEVER console.log (it would corrupt the protocol).
console.error("todo-server running on stdio");
