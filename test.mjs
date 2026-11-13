import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import contribute from "./index.server.ts";
import { preferences, DEFAULT_KEY_FILE } from "./shared/settings.ts";
import { choose, state } from "./shared/rpc.ts";
test("same Claude session switches both directions, persists, refuses busy turns, and rolls back failed reload", async () => {
  const dir = await mkdtemp(join(tmpdir(), "claude-auth-test-"));
  const oldHome = process.env.HOME,
    oldPaseo = process.env.PASEO_HOME;
  process.env.HOME = dir;
  process.env.PASEO_HOME = join(dir, "paseo");
  try {
    await mkdir(join(dir, ".secrets"));
    await writeFile(join(dir, ".secrets/paseo-claudeapi"), "fake-test-key\n");
    const handlers = new Map();
    let hook;
    let status = "idle";
    let fail = false;
    const launches = [];
    let keyFile = DEFAULT_KEY_FILE;
    const server = {
      registerSettings: () => ({
        read: async () => ({
          status: "ready",
          values: preferences.schema.parse({ keyFile }),
        }),
      }),
      before: (name, fn) => {
        hook = fn;
      },
      handle: (rpc, fn) => handlers.set(rpc, fn),
    };
    contribute(server);
    const request = {
      agentId: "same-session",
      provider: "claude",
      env: { KEEP: "yes" },
    };
    const ref = {
      refresh: async () => ({ agent: { provider: "claude", status } }),
      reload: async () => {
        if (fail) throw Error("failed");
        launches.push(await hook({ request }));
      },
    };
    const ctx = {
      paseo: {
        agents: {
          ref: (id) => {
            assert.equal(id, "same-session");
            return ref;
          },
        },
      },
    };
    const select = (mode) =>
      handlers.get(choose)({ agentId: "same-session", mode }, ctx);
    await select("api");
    assert.equal(launches[0].env.ANTHROPIC_API_KEY, "fake-test-key");
    assert.equal(launches[0].env.CLAUDE_CODE_OAUTH_TOKEN, "");
    assert.equal(launches[0].env.KEEP, "yes");
    await writeFile(join(dir, "custom-key"), "custom-test-key\n");
    keyFile = "~/custom-key";
    assert.equal(
      (await hook({ request })).env.ANTHROPIC_API_KEY,
      "custom-test-key",
    );
    keyFile = join(dir, "custom-key");
    assert.equal(
      (await hook({ request })).env.ANTHROPIC_API_KEY,
      "custom-test-key",
    );
    await writeFile(join(dir, "custom-key"), "rotated-test-key\n");
    assert.equal(
      (await hook({ request })).env.ANTHROPIC_API_KEY,
      "rotated-test-key",
    );
    keyFile = "~/missing-key";
    await assert.rejects(hook({ request }), /ENOENT/);
    keyFile = DEFAULT_KEY_FILE;
    await select("regular");
    assert.equal(launches[1].env.ANTHROPIC_API_KEY, "");
    assert.equal(launches[1].agentId, "same-session");
    status = "running";
    await assert.rejects(select("api"), /current turn/);
    assert.equal(launches.length, 2);
    status = "idle";
    fail = true;
    await assert.rejects(select("api"), /Previous selection restored/);
    assert.equal((await handlers.get(state)())["same-session"], "regular");
    const stored = await readFile(
      join(dir, "paseo/claude-auth/modes.json"),
      "utf8",
    );
    assert.equal(JSON.parse(stored)["same-session"], "regular");
    assert.ok(!stored.includes("fake-test-key"));
    assert.equal(
      await hook({ request: { ...request, provider: "codex" } }),
      undefined,
    );
    contribute(server);
    assert.equal((await handlers.get(state)())["same-session"], "regular");
  } finally {
    if (oldHome === undefined) delete process.env.HOME;
    else process.env.HOME = oldHome;
    if (oldPaseo === undefined) delete process.env.PASEO_HOME;
    else process.env.PASEO_HOME = oldPaseo;
    await rm(dir, { recursive: true, force: true });
  }
});

test("key file settings keep the default and reject ambiguous relative or empty paths", () => {
  assert.equal(
    preferences.schema.parse({}).keyFile,
    "~/.secrets/paseo-claudeapi",
  );
  assert.equal(
    preferences.schema.parse({ keyFile: "  ~/custom-key  " }).keyFile,
    "~/custom-key",
  );
  assert.equal(
    preferences.schema.safeParse({ keyFile: "relative/key" }).success,
    false,
  );
  assert.equal(preferences.schema.safeParse({ keyFile: "" }).success, false);
});
