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
import { message, status, textOf } from "./helpers.js";

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

    // For now: answer straight away, and finish the task.
    bus.publish({
      kind: "statusUpdate",
      data: {
        taskId,
        contextId,
        status: status(
          TaskState.TASK_STATE_COMPLETED,
          message(Role.ROLE_AGENT, `You asked: "${userText}". Searching comes next!`, { taskId, contextId })
        ),
        metadata: undefined,
      },
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
