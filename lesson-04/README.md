# Lesson 4: Resources and Prompts

The todo server now offers all three MCP primitives:

| Primitive | Name | Who triggers it |
|---|---|---|
| Tool | `add_todo`, `list_todos`, `complete_todo` | The AI |
| Resource | `todo://all`, template `todo://item/{id}` | The app |
| Prompt | `plan_my_day` | The user |

```bash
cd todo-mcp
npm install
npm run build
```

## complete_todo and isError

```bash
node client.mjs add_todo '{"task":"Call Raj"}' complete_todo '{"id":1}' list_todos
node client.mjs complete_todo '{"id":99}'      # isError from our handler: No todo with id 99
node client.mjs complete_todo '{"id":"one"}'   # isError from the SDK's zod check
```

## All three primitives in one session

```bash
node tour.mjs
```

The list lives in memory, so `tour.mjs` does everything in one session: adds and completes todos, lists and reads resources (including the template), and fetches the prompt.

## MCP Inspector

```bash
npm run inspect
```

Use the **Resources** tab (fixed URI and template) and the **Prompts** tab (`plan_my_day`, hours = 4).

## In a host

```bash
claude mcp add todo -- node "$PWD/build/index.js"
claude -p "Add three todos: call Raj, buy milk, and book a flight to Goa. Complete the first one, then show me my list." --allowedTools "mcp__todo"
```

In the interactive Claude Code app the prompt appears as the slash command `/mcp__todo__plan_my_day` (not in one-shot `claude -p` mode).
