import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// 1. Create the server: this is the "kitchen".
const server = new McpServer({ name: "todo-server", version: "1.0.0" });

// 2. Tools will go here.

// 3. Connect over stdio: the host starts this program and talks through stdin/stdout.
await server.connect(new StdioServerTransport());

// 4. NEVER console.log here. Use console.error.
console.error("todo-server running on stdio");
