# Lesson 3: Your First MCP Server

The todo MCP server built step by step, a tiny host (`client.mjs`) to test it, the MCP Inspector, and Claude Code.

## Set up from zero (what the video types)

```bash
mkdir todo-mcp && cd todo-mcp && npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node
npm pkg set type=module scripts.build=tsc scripts.start="node build/index.js" scripts.inspect="npx @modelcontextprotocol/inspector node build/index.js"
mkdir src
```

Or just use the finished project here:

```bash
cd todo-mcp
npm install
npm run build
```

> **TypeScript 7:** keep `"types": ["node"]` in `tsconfig.json`. Without it, any `import ... from "node:fs"` fails with *Cannot find name 'node:fs'*.

## The three steps

| Step | File | What it adds |
|---|---|---|
| 1 | `steps/step1-empty-server.ts` | An empty server: create, connect over stdio, log with `console.error` |
| 2 | `steps/step2-add_todo.ts` | The `add_todo` tool with a zod input schema |
| 3 | `src/index.ts` | The `list_todos` tool (the finished server) |

To replay a step, copy its file over `src/index.ts` and run `npm run build`.

## Test it with the tiny host

```bash
node client.mjs                                                     # menu + JSON Schema
node client.mjs add_todo '{"task":"Call Raj"}' add_todo '{"task":"Buy milk"}' list_todos
node client.mjs list_todos                                          # empty: memory is lost on restart
node client.mjs add_todo '{"task":42}'                              # validation error
```

## MCP Inspector

```bash
npm run inspect                  # opens a web UI on http://127.0.0.1:6274
npx @modelcontextprotocol/inspector --cli node build/index.js --method tools/call --tool-name add_todo --tool-arg task="Call Raj"
```

## Claude Code

```bash
claude mcp add todo -- node "$PWD/build/index.js"
claude mcp get todo
claude -p "Add two todos: call Raj, and buy milk. Then show me my todo list." --allowedTools "mcp__todo"
```

Restart any open Claude Code session after `claude mcp add`; check with `/mcp`.

## Claude Desktop

Add to `claude_desktop_config.json` (Settings → Developer → Edit Config), then fully restart the app:

```json
{
  "mcpServers": {
    "todo": {
      "command": "node",
      "args": ["/absolute/path/to/todo-mcp/build/index.js"]
    }
  }
}
```

## Exercise

Add a third tool, `complete_todo`, that takes an `id` (`z.number()`) and marks that todo as done. What should happen when no todo has that id? Lesson 4 starts with the answer.
