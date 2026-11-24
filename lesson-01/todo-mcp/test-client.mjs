// test-client.mjs: plays the "host" so we can test the server without an AI.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Start our server as a child process and connect to it over stdio.
const client = new Client({ name: "test-host", version: "1.0.0" });
await client.connect(new StdioClientTransport({ command: "node", args: ["build/index.js"] }));

// Step 1 of every MCP session: "What can you do?"
const { tools } = await client.listTools();
console.log("MENU:", JSON.stringify(tools.map((t) => t.name)));

// Call the tools, exactly like an AI host would.
const text = (r) => r.content[0].text;
console.log("ADD :", text(await client.callTool({ name: "add_todo", arguments: { task: "Call Raj" } })));
console.log("ADD :", text(await client.callTool({ name: "add_todo", arguments: { task: "Buy milk" } })));
console.log("LIST:\n" + text(await client.callTool({ name: "list_todos", arguments: {} })));

await client.close();
