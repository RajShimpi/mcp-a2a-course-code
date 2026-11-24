import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// tour.mjs: one session that uses tools, resources and prompts.
const client = new Client({ name: "tour", version: "1.0.0" });
await client.connect(new StdioClientTransport({ command: "node", args: ["build/index.js"] }));
const text = (result) => result.content[0].text;

// Tools: the AI's side
await client.callTool({ name: "add_todo", arguments: { task: "Call Raj" } });
await client.callTool({ name: "add_todo", arguments: { task: "Buy milk" } });
console.log("DONE     :", text(await client.callTool({ name: "complete_todo", arguments: { id: 1 } })));

// Resources: the app's side
const { resources } = await client.listResources();
const { resourceTemplates } = await client.listResourceTemplates();
console.log("RESOURCES:", resources.map((r) => r.uri));
console.log("TEMPLATES:", resourceTemplates.map((t) => t.uriTemplate));
for (const uri of ["todo://all", "todo://item/2", "todo://item/99"]) {
  const { contents } = await client.readResource({ uri });
  console.log(`READ ${uri} ->`, contents[0].text.replace(/\s+/g, " "));
}

// Prompts: the user's side
const { prompts } = await client.listPrompts();
console.log("PROMPTS  :", prompts.map((p) => p.name));
const { messages } = await client.getPrompt({ name: "plan_my_day", arguments: { hours: "4" } });
console.log("PROMPT   :", messages[0].content.text);

await client.close();
