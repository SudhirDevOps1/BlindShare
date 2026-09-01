#!/usr/bin/env node
import { run } from "node:test";
import { spec } from "node:test/reporters";
import { resolve } from "node:path";
import { readdirSync } from "node:fs";

console.log("\n=======================================================");
console.log("🛡️  BLINDSHARE ENTERPRISE SECURITY & E2E TEST RUNNER");
console.log("=======================================================\n");

const testsDir = resolve(process.cwd(), "tests/security");
const testFiles = readdirSync(testsDir)
  .filter((f) => f.endsWith(".test.mjs") || f.endsWith(".test.js"))
  .map((f) => resolve(testsDir, f));

run({ files: testFiles })
  .on("test:fail", () => {
    process.exitCode = 1;
  })
  .compose(new spec())
  .pipe(process.stdout);
