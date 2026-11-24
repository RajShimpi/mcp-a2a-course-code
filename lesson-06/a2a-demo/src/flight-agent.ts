import express from "express";
import { Role, TaskState } from "@a2a-js/sdk";
import type { AgentCard } from "@a2a-js/sdk";
import {
  DefaultRequestHandler,
  InMemoryTaskStore,
  type AgentExecutor,
  type ExecutionEventBus,
  type RequestContext,
} from "@a2a-js/sdk/server";
import { agentCardHandler, jsonRpcHandler, UserBuilder } from "@a2a-js/sdk/server/express";
import { message, status, textOf, textPart } from "./helpers.js";

const PORT = Number(process.env.PORT ?? 4001);

// 1. AGENT CARD: the "business card" other agents read to discover us.
const agentCard: AgentCard = {
  name: "Flight Agent",
  description: "Finds flights. Asks for travel dates if you forget them.",
  version: "1.0.0",
  supportedInterfaces: [
    {
      url: `http://localhost:${PORT}/a2a/jsonrpc`,
      protocolBinding: "JSONRPC",
      protocolVersion: "1.0",
      tenant: "",
    },
  ],
  provider: undefined,
  capabilities: { streaming: true, pushNotifications: false, extensions: [] },
  securitySchemes: {},
  securityRequirements: [],
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/plain"],
  skills: [
    {
      id: "search-flights",
      name: "Search flights",
      description: "Find flights to a destination on given dates",
      tags: ["travel", "flights"],
      examples: ["Find flights to Goa", "Flights to Goa Dec 20 to Dec 25"],
      inputModes: [],
      outputModes: [],
      securityRequirements: [],
    },
  ],
  signatures: [],
};

// A pretend "does the message contain dates?" check (a real agent would use an LLM).
const hasDates = (t: string) => /\bdec\b|\d{1,2}\s*(st|nd|rd|th)?\s*(to|-)\s*\d{1,2}/i.test(t);

// 2. EXECUTOR: the agent's brain. Called once per incoming message.
class FlightAgentExecutor implements AgentExecutor {
  async execute(ctx: RequestContext, bus: ExecutionEventBus): Promise<void> {
    const { taskId, contextId } = ctx;
    const userText = textOf(ctx.userMessage);
    console.error(`[flight-agent] task ${taskId.slice(0, 8)} got: "${userText}"`);

    // Rule: the FIRST event must be a `task`. On a later turn, ctx.task already holds the history.
    bus.publish({
      kind: "task",
      data: {
        id: taskId,
        contextId,
        status: status(TaskState.TASK_STATE_SUBMITTED),
        artifacts: [],
        history: ctx.task?.history ?? [ctx.userMessage],
        metadata: undefined,
      },
    });

    // Missing info? PAUSE and ask the caller. This is the "input-required" state.
    if (!hasDates(userText)) {
      bus.publish({
        kind: "statusUpdate",
        data: {
          taskId,
          contextId,
          status: status(
            TaskState.TASK_STATE_INPUT_REQUIRED,
            message(Role.ROLE_AGENT, "Which dates do you want to travel?", { taskId, contextId })
          ),
          metadata: undefined,
        },
      });
      bus.finished();
      return;
    }

    // We have what we need: do the work.
    bus.publish({
      kind: "statusUpdate",
      data: { taskId, contextId, status: status(TaskState.TASK_STATE_WORKING), metadata: undefined },
    });
    // Report PROGRESS while working. Streaming clients see each of these the moment it's published.
    for (const step of ["Searching 3 airlines...", "Comparing prices...", "Checking seat availability..."]) {
      await new Promise((r) => setTimeout(r, 700)); // pretend each step takes time
      bus.publish({
        kind: "statusUpdate",
        data: {
          taskId,
          contextId,
          status: status(TaskState.TASK_STATE_WORKING, message(Role.ROLE_AGENT, step, { taskId, contextId })),
          metadata: undefined,
        },
      });
    }

    // The RESULT is an Artifact.
    bus.publish({
      kind: "artifactUpdate",
      data: {
        taskId,
        contextId,
        artifact: {
          artifactId: "flight-options",
          name: "Flight options",
          description: "Three matching flights",
          parts: [
            textPart(
              "1) AirIndia AI-683 06:10 - Rs 5,400\n" +
                "2) IndiGo 6E-211 09:45 - Rs 4,900\n" +
                "3) Akasa QP-1312 18:20 - Rs 6,100"
            ),
          ],
          metadata: undefined,
          extensions: [],
        },
        append: false,
        lastChunk: true,
        metadata: undefined,
      },
    });

    bus.publish({
      kind: "statusUpdate",
      data: { taskId, contextId, status: status(TaskState.TASK_STATE_COMPLETED), metadata: undefined },
    });
    bus.finished();
  }

  async cancelTask(taskId: string, bus: ExecutionEventBus): Promise<void> {
    bus.publish({
      kind: "statusUpdate",
      data: { taskId, contextId: "", status: status(TaskState.TASK_STATE_CANCELED), metadata: undefined },
    });
    bus.finished();
  }
}

// 3. WIRE IT UP: the request handler, and two web routes.
const handler = new DefaultRequestHandler(agentCard, new InMemoryTaskStore(), new FlightAgentExecutor());

const app = express();
app.use("/.well-known/agent-card.json", agentCardHandler({ agentCardProvider: handler }));
app.use("/a2a/jsonrpc", jsonRpcHandler({ requestHandler: handler, userBuilder: UserBuilder.noAuthentication }));

app.listen(PORT, "127.0.0.1", () => {
  console.error(`[flight-agent] card: http://localhost:${PORT}/.well-known/agent-card.json`);
});
