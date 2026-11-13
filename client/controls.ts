import type {
  PluginClientContext,
  PluginButtonRegistration,
  PluginButton,
} from "@getpaseo/plugin/client";
import { state, choose, report } from "../shared/rpc";
type Agent = {
  id: string;
  provider: string;
  workspaceId?: string | null;
  status: string;
};
export default function contribute(client: PluginClientContext) {
  const agents = new Map<string, Agent>();
  const pills = new Map<string, PluginButtonRegistration>();
  let modes: Record<string, "regular" | "api"> = {};
  const busy = new Set<string>();
  const errors = new Map<string, string>();
  const lifetime = new AbortController();
  let stopped = false;
  function sync(agent: Agent) {
    if (stopped) return;
    if (agent.provider !== "claude" || !agent.workspaceId) {
      pills.get(agent.id)?.remove();
      pills.delete(agent.id);
      return;
    }
    const selected = modes[agent.id] || "regular";
    const disabled =
      busy.has(agent.id) ||
      agent.status === "running" ||
      agent.status === "initializing";
    const button = {
      title: errors.get(agent.id) || "Claude authentication",
      label: busy.has(agent.id)
        ? "Switching…"
        : errors.has(agent.id)
          ? "Auth: retry"
          : selected === "api"
            ? "Claude: API key"
            : "Claude: regular login",
      icon: "KeyRound" as const,
      behavior: {
        kind: "menu" as const,
        items: (["regular", "api"] as const).map((mode) => ({
          kind: "item" as const,
          id: mode,
          title: mode === "api" ? "Use API key" : "Use regular login",
          icon:
            mode === selected ? ("CircleCheck" as const) : ("Circle" as const),
          disabled: disabled || (mode === selected && !errors.has(agent.id)),
          behavior: {
            kind: "action" as const,
            onPress: async () => {
              busy.add(agent.id);
              errors.delete(agent.id);
              sync(agent);
              try {
                await client.rpc(choose, { agentId: agent.id, mode });
                modes = await client.rpc(state, {});
              } catch (error) {
                errors.set(
                  agent.id,
                  error instanceof Error
                    ? error.message
                    : "Authentication switch failed",
                );
                throw error;
              } finally {
                busy.delete(agent.id);
                sync(agents.get(agent.id) || agent);
              }
            },
          },
        })),
      },
    };
    buttons.set(agent.id, button);
    const existing = pills.get(agent.id);
    if (existing) existing.update(button);
    else
      pills.set(
        agent.id,
        client.addComposerPill({
          id: "authentication",
          workspaceId: agent.workspaceId,
          agentId: agent.id,
          button,
        }),
      );
    syncHeader(agent.workspaceId);
  }
  const headers = new Map<string, PluginButtonRegistration>();
  const buttons = new Map<string, PluginButton>();
  function syncHeader(workspaceId: string) {
    const group = [...agents.values()].filter(
      (a) => a.workspaceId === workspaceId && a.provider === "claude",
    );
    if (!group.length) return;
    const button = {
      title: "Claude authentication",
      label: "Claude login / API",
      icon: "KeyRound" as const,
      behavior: {
        kind: "menu" as const,
        items: group.map((a, index) => ({
          kind: "item" as const,
          id: "session-" + index,
          title:
            group.length === 1
              ? "This Claude session"
              : "Claude session " + a.id.slice(0, 8),
          behavior: buttons.get(a.id)!.behavior,
        })),
      },
    };
    const existing = headers.get(workspaceId);
    if (existing) existing.update(button);
    else
      headers.set(
        workspaceId,
        client.addHeaderButton({
          id: "claude-authentication",
          workspaceId,
          button,
        }),
      );
  }
  function track(agent: Agent) {
    agents.set(agent.id, agent);
    sync(agent);
  }
  async function refreshModes() {
    modes = await client.rpc(state, {});
    for (const a of agents.values()) sync(a);
  }
  async function older(cursor: string | null | undefined) {
    while (cursor && !stopped) {
      const result = await client.paseo.agents.list({
        signal: lifetime.signal,
        page: { limit: 200, cursor },
      });
      for (const { agent } of result.entries) track(agent);
      cursor = result.pageInfo.hasMore ? result.pageInfo.nextCursor : null;
    }
  }
  void refreshModes().catch(() => {});
  const timer = setInterval(() => {
    void refreshModes().catch(() => {});
  }, 5000);
  void client.paseo.agents
    .list({ subscribe: {}, signal: lifetime.signal, page: { limit: 200 } })
    .then(({ subscription }) => {
      subscription.subscribe({
        snapshot: ({ entries, pageInfo }) => {
          for (const { agent } of entries) track(agent);
          void older(pageInfo.hasMore ? pageInfo.nextCursor : null).catch(
            () => {},
          );
        },
        update: (message) => {
          if (message.type !== "agent_update") return;
          const u = message.payload;
          if (u.kind === "remove") {
            agents.delete(u.agentId);
            pills.get(u.agentId)?.remove();
            pills.delete(u.agentId);
          } else track(u.agent);
        },
      });
    })
    .catch((error) => {
      void client
        .rpc(report, { registered: pills.size, error: String(error) })
        .catch(() => {});
    });
  const diagnostics = setTimeout(() => {
    void client.rpc(report, { registered: pills.size }).catch(() => {});
  }, 1500);
  return () => {
    for (const h of headers.values()) h.remove();
    clearTimeout(diagnostics);
    stopped = true;
    lifetime.abort();
    clearInterval(timer);
    for (const pill of pills.values()) pill.remove();
  };
}
