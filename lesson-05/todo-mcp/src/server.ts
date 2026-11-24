import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

type Todo = { id: number; task: string; done: boolean };

// ---- Persistence: save todos to a JSON file so they survive restarts ----
const FILE = process.env.TODO_FILE ?? join(homedir(), ".todo-mcp", "todos.json");

function load(): Todo[] {
  try {
    return JSON.parse(readFileSync(FILE, "utf8"));
  } catch {
    return []; // first run: no file yet
  }
}

function save(todos: Todo[]) {
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(todos, null, 2));
}

// Build a fresh server. (HTTP mode creates one per request, so this is a function.)
export function createServer() {
  const server = new McpServer({ name: "todo-server", version: "1.1.0" });

  server.registerTool(
    "add_todo",
    {
      description: "Add a new task to the user's todo list",
      inputSchema: {
        // Validation: reject empty or huge input before our code runs.
        task: z.string().trim().min(1).max(200).describe("What needs to be done"),
      },
    },
    async ({ task }) => {
      const todos = load();
      const id = todos.reduce((m, t) => Math.max(m, t.id), 0) + 1;
      todos.push({ id, task, done: false });
      save(todos);
      return { content: [{ type: "text", text: `Added #${id}: ${task}` }] };
    }
  );

  server.registerTool(
    "list_todos",
    {
      description: "Show all tasks in the todo list, with their done status",
      annotations: { readOnlyHint: true }, // tells the host this tool changes nothing
    },
    async () => {
      const todos = load();
      const text = todos.length
        ? todos.map((t) => `#${t.id} [${t.done ? "x" : " "}] ${t.task}`).join("\n")
        : "The todo list is empty.";
      return { content: [{ type: "text", text }] };
    }
  );

  server.registerTool(
    "complete_todo",
    {
      description: "Mark a todo as done, using its id number",
      inputSchema: { id: z.number().int().positive().describe("The todo's id, e.g. 1") },
    },
    async ({ id }) => {
      const todos = load();
      const todo = todos.find((t) => t.id === id);
      if (!todo) {
        return { isError: true, content: [{ type: "text", text: `No todo with id ${id}` }] };
      }
      todo.done = true;
      save(todos);
      return { content: [{ type: "text", text: `Completed #${id}: ${todo.task}` }] };
    }
  );

  server.registerTool(
    "delete_todo",
    {
      description: "Permanently delete a todo by id. Cannot be undone.",
      inputSchema: { id: z.number().int().positive() },
      annotations: { destructiveHint: true }, // hosts can ask the user to confirm
    },
    async ({ id }) => {
      const todos = load();
      const next = todos.filter((t) => t.id !== id);
      if (next.length === todos.length) {
        return { isError: true, content: [{ type: "text", text: `No todo with id ${id}` }] };
      }
      save(next);
      return { content: [{ type: "text", text: `Deleted #${id}` }] };
    }
  );

  server.registerResource(
    "all-todos",
    "todo://all",
    { description: "The full todo list as JSON", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, text: JSON.stringify(load(), null, 2) }],
    })
  );

  server.registerResource(
    "one-todo",
    new ResourceTemplate("todo://item/{id}", { list: undefined }),
    { description: "A single todo by id", mimeType: "application/json" },
    async (uri, { id }) => {
      const todo = load().find((t) => t.id === Number(id));
      return {
        contents: [
          { uri: uri.href, text: todo ? JSON.stringify(todo) : `No todo with id ${id}` },
        ],
      };
    }
  );

  server.registerPrompt(
    "plan_my_day",
    {
      description: "Turn my todo list into a simple plan for today",
      argsSchema: { hours: z.string().describe("Hours available today, e.g. 4") },
    },
    ({ hours }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              `I have ${hours} hours today. Use the list_todos tool to read my tasks, ` +
              `then make a short, ordered plan for the unfinished ones.`,
          },
        },
      ],
    })
  );

  return server;
}
