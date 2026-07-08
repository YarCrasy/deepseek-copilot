import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";
import Mocha from "mocha";

const outDir = resolve(".tmp/unit-tests");
const entryPoints = [
  "src/test/ApplyPatch.test.ts",
  "src/test/DangerAnalysis.test.ts",
  "src/test/EditFile.test.ts",
  "src/test/ToolRegistry.test.ts",
  "src/test/ToolWorkspace.test.ts",
];

rmSync(outDir, { recursive: true, force: true });

await esbuild.build({
  entryPoints,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node24",
  outdir: outDir,
  sourcemap: true,
  packages: "external",
});

const mocha = new Mocha({
  color: true,
  ui: "tdd",
});

for (const entryPoint of entryPoints) {
  const fileName = entryPoint.split("/").pop()?.replace(/\.ts$/, ".js");
  if (fileName) {
    mocha.addFile(resolve(outDir, fileName));
  }
}

await mocha.loadFilesAsync({
  esmDecorator: async (file) => import(pathToFileURL(file).href),
});

const failures = await new Promise((resolveRun) => {
  mocha.run((failureCount) => resolveRun(failureCount));
});

if (failures) {
  process.exitCode = 1;
}
