import { test } from "node:test";
import assert from "node:assert/strict";
import contribute from "./client/controls.ts";
import { choose, state } from "./shared/rpc.ts";
test("picker and workspace menu attach to an existing Claude session and switch in both directions", async () => {
  const pills = new Map(),
    headers = new Map(),
    modes = {};
  const changes = [];
  const agent = {
    id: "existing",
    provider: "claude",
    workspaceId: "workspace",
    status: "idle",
  };
  let listener;
  const ctx = {
    addSurface() {},
    addSidebarItem() {},
    paseo: {
      agents: {
        list: async () => ({
          subscription: {
            subscribe: (hooks) => {
              listener = hooks;
              hooks.snapshot({
                entries: [{ agent }],
                pageInfo: { hasMore: false },
              });
            },
          },
        }),
      },
    },
    rpc: async (contract, input) => {
      if (contract === state) return { ...modes };
      if (contract === choose) {
        modes[input.agentId] = input.mode;
        changes.push(input.mode);
        return { ok: true };
      }
      return { ok: true };
    },
    addComposerPill: (input) => {
      pills.set(input.agentId, input.button);
      return {
        update: (button) => pills.set(input.agentId, button),
        remove: () => pills.delete(input.agentId),
      };
    },
    addHeaderButton: (input) => {
      headers.set(input.workspaceId, input.button);
      return {
        update: (button) => headers.set(input.workspaceId, button),
        remove: () => headers.delete(input.workspaceId),
      };
    },
  };
  const stop = contribute(ctx);
  try {
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(pills.size, 1);
    assert.equal(headers.size, 1);
    await pills
      .get("existing")
      .behavior.items.find((x) => x.id === "api")
      .behavior.onPress();
    assert.equal(pills.get("existing").label, "Claude: API key");
    await headers
      .get("workspace")
      .behavior.items[0].behavior.items.find((x) => x.id === "regular")
      .behavior.onPress();
    assert.equal(pills.get("existing").label, "Claude: regular login");
    assert.deepEqual(changes, ["api", "regular"]);
    listener.update({
      type: "agent_update",
      payload: { kind: "update", agent: { ...agent, status: "running" } },
    });
    assert.ok(pills.get("existing").behavior.items.every((x) => x.disabled));
  } finally {
    stop();
  }
  assert.equal(pills.size, 0);
  assert.equal(headers.size, 0);
});
