/**
 * Deep-merge packages/openclaw-skills/openclaw-planday-config.json into an
 * existing openclaw.json (stdin or first arg path). Writes merged JSON to stdout.
 * Strips _comment from the planday snippet.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const plandayPath = join(
  __dirname,
  "..",
  "packages",
  "openclaw-skills",
  "openclaw-planday-config.json",
);

const plandayRaw = JSON.parse(readFileSync(plandayPath, "utf8"));
delete plandayRaw._comment;

const basePath = process.argv[2];
const baseRaw = basePath
  ? readFileSync(basePath, "utf8")
  : readFileSync(0, "utf8");
const base = JSON.parse(baseRaw);

const uniq = (arr) => [...new Set(arr)];

const merged = { ...base };

merged.tools = { ...base.tools, ...plandayRaw.tools };
if (plandayRaw.tools?.allow?.length) {
  merged.tools.allow = uniq([
    ...(base.tools?.allow ?? []),
    ...plandayRaw.tools.allow,
  ]);
}

merged.skills = { ...base.skills, ...plandayRaw.skills };
merged.skills.entries = {
  ...base.skills?.entries,
  ...plandayRaw.skills.entries,
};

// Note: OpenClaw 2026.4.x rejects agents.defaults.skills — skills load from
// ~/.openclaw/skills/*/SKILL.md and skills.entries only.

process.stdout.write(JSON.stringify(merged, null, 2) + "\n");
