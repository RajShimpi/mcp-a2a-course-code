// PERSONAL ASSISTANT: uses BOTH protocols.
//   A2A  -> talks to another AGENT (Flight Agent)        [agent <-> agent]
//   MCP  -> uses a TOOL server (the todo list)           [agent <-> tool]
import { Role, TaskState } from "@a2a-js/sdk";
import type { SendMessageRequest, Task } from "@a2a-js/sdk";
import { ClientFactory } from "@a2a-js/sdk/client";
import { Client as McpClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { message, textOf } from "./helpers.js";

const FLIGHT_AGENT_URL = process.env.FLIGHT_AGENT_URL ?? "http://localhost:4001";
const TODO_SERVER = fileURLToPath(new URL("../../todo-mcp/build/index.js", import.meta.url));

// ---------- the assistant's two "connections" ----------

async function connectTools() {
  const mcp = new McpClient({ name: "personal-assistant", version: "1.0.0" });
  await mcp.connect(
    new StdioClientTransport({ command: "node", args: [TODO_SERVER], env: { ...process.env } as Record<string, string> })
  );
  return mcp;
}

// Credentials for the remote agent. Read from the environment, never hard-coded.
const AGENT_TOKEN = process.env.AGENT_TOKEN;
const authOptions = AGENT_TOKEN ? { serviceParameters: { Authorization: `Bearer ${AGENT_TOKEN}` } } : undefined;

const req = (text: string, ids: { taskId?: string; contextId?: string } = {}): SendMessageRequest => ({
  tenant: "",
  message: message(Role.ROLE_USER, text, ids),
  configuration: undefined,
  metadata: undefined,
});

// Ask the flight agent. If it needs more info, `askUser` supplies the answer.
async function askFlightAgent(goal: string, askUser: (q: string) => Promise<string>): Promise<string> {
  const agent = await new ClientFactory().createFromUrl(FLIGHT_AGENT_URL);
  let result = await agent.sendMessage(req(goal), authOptions);

  // Loop while the agent keeps asking questions (the A2A "input-required" state).
  const MAX_ROUNDS = 3; // a remote agent must never be able to trap us in a loop
  let rounds = 0;
  while (!("messageId" in result) && result.status?.state === TaskState.TASK_STATE_INPUT_REQUIRED) {
    const task: Task = result;
    if (++rounds > MAX_ROUNDS) {
      // Be polite and tell the agent we're giving up, then fail loudly.
      await agent.cancelTask({ tenant: "", id: task.id, metadata: undefined }, authOptions);
      throw new Error(`flight agent still needs input after ${MAX_ROUNDS} rounds; giving up`);
    }
    const question = textOf(task.status?.message);
    console.log(`   [A2A] flight agent asks: "${question}"`);
    const answer = await askUser(question);
    console.log(`   [A2A] assistant answers: "${answer}"`);
    result = await agent.sendMessage(req(answer, { taskId: task.id, contextId: task.contextId }), authOptions);
  }

  if ("messageId" in result) return textOf(result);
  if (result.status?.state !== TaskState.TASK_STATE_COMPLETED) {
    throw new Error(`flight agent ended in ${TaskState[result.status?.state ?? 0]}`);
  }
  return result.artifacts.flatMap((a) => a.parts.map((p) => (p.content?.$case === "text" ? p.content.value : ""))).join("\n");
}

// ---------- the assistant's plan ----------

async function main() {
  const destination = process.argv[2] ?? "Goa";
  const dates = process.argv[3] ?? "Dec 20 to 25";
  console.log(`USER: "Plan my trip to ${destination}"\n`);

  const todo = await connectTools();
  try {
    console.log("1. Find flights  (A2A -> Flight Agent)");
    const flights = await askFlightAgent(`Find flights to ${destination}`, async () => dates);
    console.log("   [A2A] result:\n" + flights.replace(/^/gm, "      "));

    // Use the AGENT's output to make a decision: pick the cheapest.
    const options = flights
      .split("\n")
      .map((line) => ({ line, price: Number((/Rs ([\d,]+)/.exec(line)?.[1] ?? "").replaceAll(",", "")) }))
      .filter((o) => o.price > 0)
      .sort((a, b) => a.price - b.price);
    const best = options[0];
    if (!best) throw new Error("no priced flight options found");
    const bestName = best.line.replace(/^\d\)\s*/, "").split(" - ")[0];

    console.log(`\n2. Cheapest is: ${bestName}  (Rs ${best.price})`);
    console.log("\n3. Save reminders  (MCP -> todo server)");
    for (const task of [`Book ${bestName} to ${destination} (${dates})`, `Pack bags for ${destination}`]) {
      const r = await todo.callTool({ name: "add_todo", arguments: { task } });
      console.log("   [MCP] add_todo ->", (r.content as { text: string }[])[0].text);
    }

    const list = await todo.callTool({ name: "list_todos", arguments: {} });
    console.log("\n4. Final todo list  (read back via MCP)\n" + (list.content as { text: string }[])[0].text.replace(/^/gm, "   "));
  } finally {
    await todo.close();
  }
}

main().catch((e) => {
  console.error("assistant failed:", e);
  process.exit(1);
});
