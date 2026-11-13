import type { PluginClientContext } from "@getpaseo/plugin/client";
import contributeControls from "./client/controls";
import { SettingsScreen } from "./client/settings-screen";
export default function contribute(client: PluginClientContext) {
  const stopSettings = client.addSettingsScreen({
    id: "credentials",
    title: "Claude Auth Switch",
    icon: "KeyRound",
    Component: SettingsScreen,
  });
  const stopControls = contributeControls(client);
  return () => {
    stopControls();
    stopSettings();
  };
}
