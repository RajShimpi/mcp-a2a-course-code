# Lesson 1: Why MCP and A2A Exist

Two small projects:

- **todo-mcp/**: an MCP server with two tools, `add_todo` and `list_todos`, plus a test client that plays the host.
- **a2a-demo/**: an A2A **Flight Agent** (with an Agent Card, and a task that asks back for dates), an A2A client, and a **personal assistant** that uses both protocols at once: A2A to talk to the Flight Agent, MCP to save todos.

## 1. The MCP server

```bash
cd todo-mcp
npm install
npm run build
node test-client.mjs
```

Expected output:

```text
MENU: ["add_todo","list_todos"]
ADD : Added #1: Call Raj
ADD : Added #2: Buy milk
LIST:
#1 [ ] Call Raj
#2 [ ] Buy milk
```

Use it from Claude Code:

```bash
claude mcp add todo -- node "$PWD/build/index.js"
```

## 2. The A2A agent

Terminal 1, start the Flight Agent (port 4001):

```bash
cd a2a-demo
npm install
npm run agent
```

Terminal 2, read its Agent Card, then talk to it:

```bash
curl -s http://localhost:4001/.well-known/agent-card.json
npm run client
```

The agent answers with `input-required` ("Which dates do you want to travel?"), the client replies, and the task completes with three flight options.

## 3. MCP + A2A together

Build `todo-mcp` first (step 1), keep the Flight Agent running, then:

```bash
cd a2a-demo
npm run assistant
```

The assistant asks the Flight Agent for flights over **A2A**, picks the cheapest, and saves reminders with the todo server over **MCP**. It expects `todo-mcp` to sit next to `a2a-demo`, as in this folder.
