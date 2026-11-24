// Entry point 2: REMOTE server over Streamable HTTP (a URL anyone can connect to).
import { createServer as createHttpServer } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 3000);
// Only listen on localhost by default. Exposing it wider needs real authentication!
const HOST = process.env.HOST ?? "127.0.0.1";

async function readBody(req: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : undefined;
}

const http = createHttpServer(async (req, res) => {
  if (req.url !== "/mcp") {
    res.writeHead(404).end("Not found. MCP endpoint is /mcp");
    return;
  }
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST" }).end("Use POST");
    return;
  }
  try {
    // Stateless mode: a fresh server + transport for every request.
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, await readBody(req));
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500).end("Internal error");
  }
});

http.listen(PORT, HOST, () => {
  console.error(`todo-server on http://${HOST}:${PORT}/mcp`);
});
