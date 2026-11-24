# MCP & A2A Complete Course: lesson code

The code from the **MCP & A2A Complete Course** video lessons. Each lesson folder holds exactly the code typed and run in that video, so you can follow along or skip straight to running it.

| Lesson | Video topic | Folder |
|---|---|---|
| 1 | Why MCP and A2A exist: a first MCP server and a first A2A agent | [lesson-01](lesson-01) |
| 2 | MCP in detail: handshake, JSON-RPC, transports, tools/resources/prompts | [lesson-02](lesson-02) |
| 3 | Your first MCP server, step by step + MCP Inspector + Claude Code | [lesson-03](lesson-03) |
| 4 | Resources, resource templates and prompts; isError | [lesson-04](lesson-04) |
| 5 | Making it real: persistence, validation, annotations, HTTP | [lesson-05](lesson-05) |
| 6 | Your first A2A agent: Agent Card, tasks, input-required, raw JSON-RPC | [lesson-06](lesson-06) |

More lessons are added as their videos come out.

## Requirements

- **Node.js 20 or newer** (the A2A SDK in Lesson 1 needs 20+; the videos used Node 26)
- npm
- Optional: `jq` for the raw JSON-RPC demo in Lesson 2, and [Claude Code](https://claude.com/claude-code) to use the MCP server with a real AI

## Quick start

```bash
git clone https://github.com/RajShimpi/mcp-a2a-course-code.git
cd mcp-a2a-course-code/lesson-01/todo-mcp
npm install
npm run build
node test-client.mjs
```

Every lesson folder has its own README with the exact commands from the video.

> Tip: run `npm run build` after every code change. MCP hosts run the compiled `build/index.js`, not the `.ts` file.
