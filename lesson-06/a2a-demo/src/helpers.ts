import { randomUUID } from "node:crypto";
import { Role, TaskState } from "@a2a-js/sdk";
import type { Message, Part, TaskStatus } from "@a2a-js/sdk";

// The v1.0 SDK uses protobuf-style objects (every field present).
// These tiny helpers hide that noise so the lesson code stays readable.

export const textPart = (value: string): Part => ({
  content: { $case: "text", value },
  metadata: undefined,
  filename: "",
  mediaType: "text/plain",
});

export const message = (
  role: Role,
  text: string,
  ids: { taskId?: string; contextId?: string } = {}
): Message => ({
  messageId: randomUUID(),
  contextId: ids.contextId ?? "",
  taskId: ids.taskId ?? "",
  role,
  parts: [textPart(text)],
  metadata: undefined,
  extensions: [],
  referenceTaskIds: [],
});

export const status = (state: TaskState, msg?: Message): TaskStatus => ({
  state,
  message: msg,
  timestamp: new Date().toISOString(),
});

// Pull all text out of a message's parts.
export const textOf = (m?: Message): string =>
  (m?.parts ?? [])
    .map((p) => (p.content?.$case === "text" ? p.content.value : ""))
    .join(" ")
    .trim();
