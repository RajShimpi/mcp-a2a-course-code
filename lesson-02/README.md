# Lesson 2: MCP in Detail

The todo server from Lesson 1, now with all three primitives (a tool, a **resource** `todo://all`, and a **prompt** `plan_my_day`), plus three files to look inside the protocol.

```bash
cd todo-mcp
npm install
npm run build
```

## The handshake by hand

`session.jsonl` holds four raw JSON-RPC messages: `initialize`, `notifications/initialized`, `tools/list`, and a `tools/call`. Feed them to the server and read each reply (needs `jq`):

```bash
node build/index.js < session.jsonl | sed -n 1p | jq .   # initialize reply
node build/index.js < session.jsonl | sed -n 2p | jq .   # the tools menu
node build/index.js < session.jsonl | sed -n 3p | jq .   # the tool result
```

## Spy on every message

```bash
node spy.mjs
```

Prints every message between client and server, in order, with its direction.

## The console.log bug

`extras/console-log-bug.ts` is the server with one `console.error` changed to `console.log`. To see the damage:

```bash
cp src/index.ts /tmp/index.backup.ts
cp extras/console-log-bug.ts src/index.ts
npm run build
node build/index.js < session.jsonl 2>/dev/null | jq -c .   # jq: parse error
node spy.mjs                                                # PROTOCOL ERROR
cp /tmp/index.backup.ts src/index.ts && npm run build       # fix it
```

## All three primitives

```bash
node explore.mjs
```

Calls a tool, lists and reads the `todo://all` resource, and fetches the `plan_my_day` prompt.
