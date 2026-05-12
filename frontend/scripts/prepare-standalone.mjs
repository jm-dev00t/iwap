import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const standaloneNextDir = path.join(standaloneDir, ".next");

if (!existsSync(standaloneDir)) {
  process.exit(0);
}

await mkdir(standaloneNextDir, { recursive: true });
await rm(path.join(standaloneNextDir, "static"), { recursive: true, force: true });
await cp(path.join(root, ".next", "static"), path.join(standaloneNextDir, "static"), { recursive: true });

if (existsSync(path.join(root, "public"))) {
  await rm(path.join(standaloneDir, "public"), { recursive: true, force: true });
  await cp(path.join(root, "public"), path.join(standaloneDir, "public"), { recursive: true });
}
