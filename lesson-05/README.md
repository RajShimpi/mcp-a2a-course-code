# Lesson 5: Making It Real

One brain, two doors:

```text
src/
  server.ts   the tools, resources and prompt (shared)
  index.ts    door 1: local, over stdio
  http.ts     door 2: remote, over Streamable HTTP
```

```bash
cd todo-mcp
npm install
npm run build
```

## Persistence

Todos are saved to `~/.todo-mcp/todos.json` (override with `TODO_FILE`).

```bash
node client.mjs add_todo '{"task":"Call Raj"}' add_todo '{"task":"Buy milk"}'
node client.mjs list_todos          # a new server process: still there
cat ~/.todo-mcp/todos.json
```

## Validation and annotations

```bash
node client.mjs add_todo '{"task":"   "}'        # rejected: too small
node client.mjs complete_todo '{"id":-1}'        # rejected: must be positive
node client.mjs complete_todo '{"id":1.5}'       # rejected: must be an integer
npx @modelcontextprotocol/inspector --cli node build/index.js --method tools/list | jq -c '.tools[] | {name, annotations}'
node client.mjs delete_todo '{"id":2}' list_todos
```

Annotations (`readOnlyHint`, `destructiveHint`) are hints for the host, not security.

## Remote over HTTP

```bash
PORT=3000 node build/http.js
```

In a second terminal:

```bash
curl -s -X POST http://127.0.0.1:3000/mcp -H 'content-type: application/json' -H 'accept: application/json, text/event-stream' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq -c '.result.tools | map(.name)'
claude mcp add --transport http todo-http http://127.0.0.1:3000/mcp
claude -p "What's on my todo list?" --allowedTools "mcp__todo-http"
```

> No authentication yet: the server only listens on 127.0.0.1. Never expose it publicly as it is (Lesson 12 adds OAuth).
