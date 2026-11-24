import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 1. Create the server: this is the "kitchen".
const server = new McpServer({ name: "todo-server", version: "1.0.0" });

const todos: { id: number; task: string; done: boolean }[] = [];
let nextId = 1;

// 2. Register a TOOL. The AI reads the description to know when to use it.
server.registerTool(
  "add_todo",
  {
    description: "Add a new task to the user's todo list",
    inputSchema: { task: z.string().describe("What needs to be done") },
  },
  async ({ task }) => {
    const todo = { id: nextId++, task, done: false };
    todos.push(todo);
    return { content: [{ type: "text", text: `Added #${todo.id}: ${task}` }] };
  }
);

server.registerTool(
  "list_todos",
  { description: "Show all tasks in the todo list, with their done status" },
  async () => {
    const text = todos.length
      ? todos.map((t) => `#${t.id} [${t.done ? "x" : " "}] ${t.task}`).join("\n")
      : "The todo list is empty.";
    return { content: [{ type: "text", text }] };
  }
);

// 3. A RESOURCE: data the app can read, found by its address (a URI).
server.registerResource(
  "all-todos",
  "todo://all",
  { description: "The full todo list as JSON", mimeType: "application/json" },
  async (uri) => ({
    contents: [{ uri: uri.href, text: JSON.stringify(todos, null, 2) }],
  })
);

// 4. A PROMPT: a ready-made instruction the user can pick.
server.registerPrompt(
  "plan_my_day",
  {
    description: "Turn my todo list into a plan for today",
    argsSchema: { hours: z.string().describe("Hours available today, e.g. 4") },
  },
  ({ hours }) => ({
    messages: [
      {
        role: "user",
        content: { type: "text", text: `I have ${hours} hours today. Use list_todos to read my tasks, then make a short plan.` },
      },
    ],
  })
);

// 5. Connect over stdio: the host starts this program and talks through stdin/stdout.
await server.connect(new StdioServerTransport());

// 6. NEVER console.log here. Use console.error.
console.error("todo-server running on stdio");
