// explore.mjs: look at all three primitives of our server.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "explorer", version: "1.0.0" });
await client.connect(new StdioClientTransport({ command: "node", args: ["build/index.js"] }));

// TOOLS: the AI decides when to call them.
await client.callTool({ name: "add_todo", arguments: { task: "Call Raj" } });
const { tools } = await client.listTools();
console.log("TOOLS     :", tools.map((t) => t.name).join(", "));

// RESOURCES: the app decides what to load, by address (URI).
const { resources } = await client.listResources();
console.log("RESOURCES :", resources.map((r) => r.uri).join(", "));
const res = await client.readResource({ uri: "todo://all" });
console.log("READ todo://all ->", res.contents[0].text);

// PROMPTS: the user picks one, and the server fills it in.
const { prompts } = await client.listPrompts();
console.log("PROMPTS   :", prompts.map((p) => p.name).join(", "));
const p = await client.getPrompt({ name: "plan_my_day", arguments: { hours: "4" } });
console.log("PROMPT    ->", p.messages[0].content.text);

await client.close();
