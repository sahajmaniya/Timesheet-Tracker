import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing DATABASE_URL environment variable.");
  process.exit(1);
}

const backupDir = process.env.BACKUP_DIR || "backups";
mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outFile = join(backupDir, `punchpilot-backup-${stamp}.dump`);

const result = spawnSync(
  "pg_dump",
  ["--format=custom", "--no-owner", "--no-privileges", `--file=${outFile}`, databaseUrl],
  { stdio: "inherit" },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Backup created: ${outFile}`);
