import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// A tiny host. Usage:
//   node client.mjs                          show the tool menu
//   node client.mjs add_todo '{"task":"x"}'  call tools, as name + JSON pairs
const calls = process.argv.slice(2);

const client = new Client({ name: "mini-host", version: "1.0.0" });
await client.connect(
  new StdioClientTransport({ command: "node", args: ["build/index.js"] })
);

const { name, version } = client.getServerVersion();
const capabilities = client.getServerCapabilities();
console.log(`CONNECTED to ${name} ${version}`);
console.log(`CAPABILITIES: ${JSON.stringify(capabilities)}`);

if (calls.length === 0 && capabilities.tools) {
  const { tools } = await client.listTools();
  for (const tool of tools) {
    console.log(`TOOL ${tool.name}: ${tool.description}`);
    console.log(JSON.stringify(tool.inputSchema, null, 2));
  }
}

for (let i = 0; i < calls.length; i += 2) {
  const tool = calls[i];
  const args = JSON.parse(calls[i + 1] ?? "{}");
  const result = await client.callTool({ name: tool, arguments: args });
  const label = result.isError ? "ERROR " : "RESULT";
  console.log(`${label} ${tool}: ${result.content[0].text}`);
}

await client.close();
