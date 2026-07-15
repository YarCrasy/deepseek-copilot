import { readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import * as esbuild from "esbuild";
import Mocha from "mocha";

const outDir = resolve(".tmp/unit-tests");
const testDir = resolve("src/test");
const entryPoints = readdirSync(testDir)
  .filter((fileName) => fileName.endsWith(".test.ts") && fileName !== "Extension.test.ts")
  .map((fileName) => resolve(testDir, fileName));

rmSync(outDir, { recursive: true, force: true });

await esbuild.build({
  entryPoints,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node24",
  outdir: outDir,
  outExtension: { ".js": ".mjs" },
  sourcemap: true,
  packages: "external",
});

const mocha = new Mocha({
  color: true,
  ui: "tdd",
});

for (const entryPoint of entryPoints) {
  const fileName = entryPoint.split(/[\\/]/).pop()?.replace(/\.ts$/, ".mjs");
  if (fileName) {
    mocha.addFile(resolve(outDir, fileName));
  }
}

await mocha.loadFilesAsync();

const failures = await new Promise((resolveRun) => {
  mocha.run((failureCount) => resolveRun(failureCount));
});

if (failures) {
  process.exitCode = 1;
}
