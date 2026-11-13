import { defineSettings } from "@getpaseo/plugin";
import { z } from "zod";

export const DEFAULT_KEY_FILE = "~/.secrets/paseo-claudeapi";
export const preferences = defineSettings({
  id: "credentials",
  scope: "host",
  version: 1,
  schema: z.object({
    keyFile: z
      .string()
      .trim()
      .min(1)
      .refine(
        (value) => /^(?:~[\\/]|\/|[A-Za-z]:[\\/]|\\\\)/.test(value),
        "Use an absolute path or a path starting with ~/ on the daemon machine.",
      )
      .default(DEFAULT_KEY_FILE),
  }),
});
