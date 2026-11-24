// spy.mjs: a client that prints every JSON-RPC message it sends and receives.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const log = (dir, msg) => console.log(dir, JSON.stringify(msg).slice(0, 100));

// The real road: start our server and talk over stdin/stdout.
const real = new StdioClientTransport({ command: "node", args: ["build/index.js"] });

// A transport is just an object: start, send, close, plus callbacks.
// This one passes everything to the real transport, and logs it on the way.
const spy = {
  start: () => real.start(),
  close: () => real.close(),
  send: (msg) => { log("client -> server", msg); return real.send(msg); },
  set onmessage(fn) { real.onmessage = (msg) => { log("server -> client", msg); fn(msg); }; },
  set onerror(fn) { real.onerror = fn; },
  set onclose(fn) { real.onclose = fn; },
};

const client = new Client({ name: "spy", version: "1.0.0" });
client.onerror = (e) => console.log("PROTOCOL ERROR  ", e.message);

await client.connect(spy);  // the handshake happens here
await client.listTools();   // "what can you do?"
await client.callTool({ name: "add_todo", arguments: { task: "Call Raj" } });
await client.close();
