import type { PluginServerContext } from "@getpaseo/plugin/server";
import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { state, choose, modesSchema, report } from "./shared/rpc";
type Mode = "regular" | "api";
export default function contribute(server: PluginServerContext) {
  const dir = join(
    process.env.PASEO_HOME || join(homedir(), ".paseo"),
    "claude-auth",
  );
  const file = join(dir, "modes.json");
  let modes: Record<string, Mode> = {};
  const ready = readFile(file, "utf8")
    .then((raw) => {
      modes = modesSchema.parse(JSON.parse(raw));
    })
    .catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  const locks = new Set<string>();
  let saving = Promise.resolve();
  async function save() {
    const raw = JSON.stringify(modes, null, 2) + "\n";
    saving = saving
      .catch(() => {})
      .then(async () => {
        await mkdir(dir, { recursive: true, mode: 0o700 });
        await writeFile(file + ".tmp", raw, { mode: 0o600 });
        await rename(file + ".tmp", file);
      });
    await saving;
  }
  async function key() {
    const value = (
      await readFile(join(homedir(), ".secrets/claudeapi"), "utf8")
    ).trim();
    if (!value || /[\r\n]/.test(value))
      throw new Error("API key file must contain one nonempty line.");
    return value;
  }
  server.before("agent.session_open", async ({ request }) => {
    if (request.provider !== "claude") return;
    await ready;
    const selected = modes[request.agentId];
    if (!selected) return;
    return {
      ...request,
      env: {
        ...request.env,
        ANTHROPIC_API_KEY: selected === "api" ? await key() : "",
        ...(selected === "api"
          ? { CLAUDE_CODE_OAUTH_TOKEN: "", ANTHROPIC_AUTH_TOKEN: "" }
          : {}),
      },
    };
  });
  server.handle(report, async ({ registered, error }) => {
    console.log("Client picker registrations:", registered, error || "OK");
    return { ok: true as const };
  });
  server.handle(state, async () => {
    await ready;
    return { ...modes };
  });
  server.handle(choose, async ({ agentId, mode }, { paseo }) => {
    await ready;
    if (locks.has(agentId))
      throw new Error("Authentication switch already in progress.");
    locks.add(agentId);
    const previous = modes[agentId];
    try {
      const agent = (await paseo.agents.ref(agentId).refresh())?.agent;
      if (!agent || agent.provider !== "claude")
        throw new Error("Select a Claude session.");
      if (agent.status === "running" || agent.status === "initializing")
        throw new Error(
          "Wait for the current turn to finish before switching authentication.",
        );
      if (mode === "api") await key();
      modes[agentId] = mode;
      await save();
      try {
        await paseo.agents.ref(agentId).reload();
      } catch {
        if (previous) modes[agentId] = previous;
        else delete modes[agentId];
        await save();
        throw new Error(
          "Claude could not resume with the selected authentication. Previous selection restored; reload the agent to retry.",
        );
      }
      return { ok: true as const };
    } finally {
      locks.delete(agentId);
    }
  });
  return () => {};
}
