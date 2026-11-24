import { Role, TaskState } from "@a2a-js/sdk";
import type { SendMessageRequest, Task } from "@a2a-js/sdk";
import { ClientFactory } from "@a2a-js/sdk/client";
import { message, textOf } from "./helpers.js";

const AGENT_URL = process.env.AGENT_URL ?? "http://localhost:4001";

// Wrap a text string into a full SendMessageRequest.
const request = (text: string, ids: { taskId?: string; contextId?: string } = {}): SendMessageRequest => ({
  tenant: "",
  message: message(Role.ROLE_USER, text, ids),
  configuration: undefined,
  metadata: undefined,
});

const stateName = (s?: TaskState) => TaskState[s ?? 0];

function show(label: string, task: Task) {
  console.log(`\n[${label}] state = ${stateName(task.status?.state)}`);
  if (task.status?.message) console.log(`  agent says: "${textOf(task.status.message)}"`);
  for (const a of task.artifacts) console.log(`  artifact "${a.name}":\n    ` + a.parts.map((p) => (p.content?.$case === "text" ? p.content.value : "")).join("").replaceAll("\n", "\n    "));
}

// DISCOVER: download the Agent Card, then build a client from it.
const client = await new ClientFactory().createFromUrl(AGENT_URL);
console.log("Connected to the agent found at", AGENT_URL);

// TURN 1: vague request, with no dates.
const first = await client.sendMessage(request("Find flights to Goa"));
// The reply is either a plain Message (quick answer) or a Task (tracked work).
if ("messageId" in first) throw new Error("expected a task back");
const task1 = first;
show("turn 1", task1);

// The agent paused and asked a question. Answer it on the SAME task.
if (task1.status?.state === TaskState.TASK_STATE_INPUT_REQUIRED) {
  const second = await client.sendMessage(
    request("Dec 20 to 25", { taskId: task1.id, contextId: task1.contextId })
  );
  if ("messageId" in second) throw new Error("expected a task back");
  show("turn 2", second);
  console.log("\nSame task id both turns?", second.id === task1.id);
}
