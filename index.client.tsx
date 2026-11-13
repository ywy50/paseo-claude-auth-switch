import type { PluginClientContext } from "@getpaseo/plugin/client";
import contributeControls from "./client/controls";
export default function contribute(client: PluginClientContext) {
  return contributeControls(client);
}
