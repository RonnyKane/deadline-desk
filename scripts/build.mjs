import * as esbuild from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
mkdirSync(resolve(root, "dist"), { recursive: true });

const shared = {
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  sourcemap: true,
  logLevel: "info",
};

await esbuild.build({
  ...shared,
  entryPoints: [resolve(root, "src/worker.ts")],
  outfile: resolve(root, "dist/worker.js"),
  conditions: ["worker", "browser"],
});

await esbuild.build({
  ...shared,
  entryPoints: [resolve(root, "src/api.ts")],
  outfile: resolve(root, "dist/api.js"),
  platform: "node",
});

const verify = spawnSync(process.execPath, [resolve(root, "scripts/verify-tools.mjs")], {
  cwd: root,
  stdio: "inherit",
});
if (verify.status !== 0) {
  process.exit(verify.status ?? 1);
}

console.log("deadline-desk build ok — dist/worker.js dist/api.js + public assets");
