# Lesson 6: Your First A2A Agent

A Flight Agent built with the A2A JS SDK v1.3 (A2A specification v1.0). It asks "Which dates do you want to travel?" when you forget them (the `input-required` state).

```bash
cd a2a-demo
npm install
npm run check      # type-check only (tsx runs the code directly)
npm run agent      # terminal 1: the agent on http://localhost:4001
```

## Read the Agent Card

```bash
curl -s localhost:4001/.well-known/agent-card.json | jq '{name, description, url: .supportedInterfaces[0].url, skills: [.skills[].name]}'
```

## Talk to it by hand (raw JSON-RPC)

Requests need the header `A2A-Version: 1.0`; `a2a.sh` adds it.

```bash
./a2a.sh request1.json | tee reply1.json | jq '.result.task | {id, state: .status.state, says: .status.message.parts[0].text}'

# turn 2: same taskId and contextId, now with dates
jq '{jsonrpc: "2.0", id: 2, method: "SendMessage", params: {message: {messageId: "m2", role: "ROLE_USER", taskId: .result.task.id, contextId: .result.task.contextId, parts: [{text: "Dec 20 to 25"}]}}}' reply1.json > request2.json
./a2a.sh request2.json | jq '.result.task | {state: .status.state, artifact: .artifacts[0].parts[0].text}'

# read the whole task back
jq '{jsonrpc: "2.0", id: 3, method: "GetTask", params: {id: .result.task.id}}' reply1.json > request3.json
./a2a.sh request3.json | jq -c '.result.history[] | {role, text: .parts[0].text}'
```

## The TypeScript client

```bash
npm run client     # terminal 2
```

`steps/step1-flight-agent.ts` is the first version from the video (answers right away, no dates check).

## Exercise

Make the agent also ask "Which city are you flying from?" when the request has no "from" (two rounds of `input-required`). Hint: earlier turns are in `ctx.task?.history`.
