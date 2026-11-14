import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import contribute from "../../client/controls";
import { SettingsScreen } from "../../client/settings-screen";
import { choose, state } from "../../shared/rpc";

const key = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <circle cx="16" cy="8" r="5" />
    <path d="m12.5 11.5-9 9H1v-3l3-3h3v-3l2-2" />
  </svg>
);
let button: any;
let render = () => {};
let mode = "regular";
const agent = {
  id: "demo-session",
  workspaceId: "demo-workspace",
  provider: "claude",
  status: "idle",
};
const stop = contribute({
  rpc: async (contract: any, input: any) => {
    if (contract === state) return { [agent.id]: mode };
    if (contract === choose) {
      mode = input.mode;
      return { ok: true };
    }
    return { ok: true };
  },
  paseo: {
    agents: {
      list: async () => ({
        subscription: {
          subscribe: (hooks: any) => {
            hooks.snapshot({
              entries: [{ agent }],
              pageInfo: { hasMore: false },
            });
          },
        },
      }),
    },
  },
  addComposerPill: (input: any) => {
    button = input.button;
    render();
    return {
      update: (next: any) => {
        button = next;
        render();
      },
      remove() {},
    };
  },
  addHeaderButton: () => ({ update() {}, remove() {} }),
} as any);
window.addEventListener("pagehide", stop);
function App() {
  const [open, setOpen] = useState(false);
  const [, setRevision] = useState(0);
  render = () => setRevision((n) => n + 1);
  const settings =
    new URLSearchParams(location.search).get("view") === "settings";
  return (
    <main className="frame">
      <header>
        <span className="brand">{key} Claude Auth Switch</span>
        <span className="demo">UI preview · demo session</span>
      </header>
      {settings ? (
        <section className="settings">
          <div className="section-title">Plugin settings</div>
          <SettingsScreen />
        </section>
      ) : (
        <section className="session">
          <div className="chat-title">Claude session</div>
          <div className="message">
            Continue this conversation using your API key.
          </div>
          <div className="answer">
            Choose authentication for this session without starting a new
            conversation.
          </div>
          <div className="composer-area">
            <div className="pill-anchor">
              {open && button ? (
                <div role="menu" className="menu">
                  {button.behavior.items.map((item: any) => (
                    <button
                      role="menuitem"
                      key={item.id}
                      disabled={item.disabled}
                      onClick={async () => {
                        await item.behavior.onPress();
                        setOpen(false);
                      }}
                    >
                      <span className="check">
                        {item.icon === "CircleCheck" ? "●" : "○"}
                      </span>
                      {item.title}
                    </button>
                  ))}
                </div>
              ) : null}
              <button
                aria-label="Claude authentication"
                className="pill"
                onClick={() => setOpen((v) => !v)}
              >
                {key}
                {button?.label || "Loading…"}
                <span className="chevron">⌃</span>
              </button>
            </div>
            <div className="composer">
              <span>Message the agent…</span>
              <div className="toolbar">
                <span>＋</span>
                <span>Claude model ⌄</span>
                <span>Auto mode ⌄</span>
                <span className="send">↑</span>
              </div>
            </div>
          </div>
        </section>
      )}
      <footer>
        {settings
          ? "The key file stays on the daemon machine."
          : "One saved conversation. Choose regular login or API key."}
      </footer>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
