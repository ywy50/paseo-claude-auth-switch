import { build } from "esbuild";
import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

await mkdir("dist/preview", { recursive: true });
await mkdir("assets", { recursive: true });
await build({
  entryPoints: ["tools/preview/main.tsx"],
  outfile: "dist/preview/main.js",
  bundle: true,
  platform: "browser",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"', __DEV__: "false" },
  alias: {
    "react-native": "react-native-web",
    "@getpaseo/plugin/client": resolve("tools/preview/settings.ts"),
    "@getpaseo/plugin": resolve("tools/preview/sdk.ts"),
  },
});
const files = new Map([
  [
    "/",
    [
      "text/html",
      Buffer.from(
        '<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/main.js"></script>',
      ),
    ],
  ],
  ["/main.js", ["text/javascript", await readFile("dist/preview/main.js")]],
  ["/style.css", ["text/css", await readFile("tools/preview/style.css")]],
  [
    "/icon",
    [
      "text/html",
      Buffer.from(
        "<style>html,body{margin:0;width:256px;height:256px}</style>" +
          (await readFile("tools/preview/icon.svg", "utf8")),
      ),
    ],
  ],
]);
const server = createServer((req, res) => {
  const f = files.get(new URL(req.url, "http://localhost").pathname);
  if (!f) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "Content-Type": f[0] });
  res.end(f[1]);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1040, height: 720 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (error) => {
    throw error;
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  await page.goto(base);
  await page
    .getByRole("button", { name: "Claude authentication", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Use API key" }).click();
  await page
    .getByRole("button", { name: "Claude authentication", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Use regular login" }).waitFor();
  await page.locator(".frame").screenshot({ path: "assets/picker.png" });
  await page.getByRole("menuitem", { name: "Use regular login" }).click();
  await page
    .getByRole("button", { name: "Claude authentication", exact: true })
    .filter({ hasText: "Claude: regular login" })
    .waitFor();
  await page.goto(base + "/?view=settings");
  await page.getByRole("textbox", { name: "API key file path" }).waitFor();
  await page.locator(".frame").screenshot({ path: "assets/settings.png" });
  await page
    .getByRole("textbox", { name: "API key file path" })
    .fill("~/keys/claude");
  await page.getByRole("button", { name: "Save path" }).click();
  await page
    .getByText(
      "Saved. The next API session launch or authentication switch will read this file.",
      { exact: true },
    )
    .waitFor();
  await page.goto(base + "/icon");
  await page.setViewportSize({ width: 256, height: 256 });
  await page.screenshot({ path: "assets/icon.png", omitBackground: true });
  console.log(
    "Captured picker and settings UI previews with demo host data; settings save and both menu paths render.",
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
