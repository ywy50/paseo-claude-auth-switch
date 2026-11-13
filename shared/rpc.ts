import { defineRpc } from "@getpaseo/plugin";
import { z } from "zod";
export const mode = z.enum(["regular", "api"]);
export const modesSchema = z.record(z.string(), mode);
export const state = defineRpc({
  name: "claude-auth.state",
  input: z.object({}),
  output: modesSchema,
});
export const choose = defineRpc({
  name: "claude-auth.choose",
  input: z.object({ agentId: z.string(), mode }),
  output: z.object({ ok: z.literal(true) }),
});
export const report = defineRpc({
  name: "claude-auth.client-report",
  input: z.object({ registered: z.number(), error: z.string().optional() }),
  output: z.object({ ok: z.literal(true) }),
});
