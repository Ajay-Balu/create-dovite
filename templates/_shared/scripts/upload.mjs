#!/usr/bin/env node
/**
 * upload.mjs — build and publish this app to Domo (`<pm> run upload`).
 *
 * 1. Bumps `version` in public/manifest.json (patch +1, each part rolls over at 9):
 *      0.0.1 → 0.0.2 … 0.0.9 → 0.1.0 … 0.9.9 → 1.0.0 … 9.9.9 → 10.0.0 → 10.0.1 …
 * 2. Runs the project's `build` script (copies public/manifest.json into dist/).
 * 3. Runs `domo publish` inside dist/.
 * 4. After the first publish, copies the `id` Domo wrote into dist/manifest.json
 *    back into public/manifest.json (so later builds update the same design).
 * If the build or publish fails, the version bump is rolled back.
 *
 * Flags:  --no-bump   publish without changing the version
 *         --dry-run   only print the next version
 */
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "public", "manifest.json");
const distManifestPath = join(root, "dist", "manifest.json");
const args = new Set(process.argv.slice(2));

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const writeJson = (p, data) => writeFileSync(p, JSON.stringify(data, null, 2) + "\n");

/** Patch +1; patch and minor roll over after 9, major grows without limit. */
export function nextVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version ?? "").trim());
  if (!match) {
    throw new Error(`manifest version "${version}" is not in X.Y.Z form (e.g. 0.0.1)`);
  }
  let [major, minor, patch] = match.slice(1).map(Number);
  patch += 1;
  if (patch > 9) {
    minor += Math.floor(patch / 10);
    patch %= 10;
  }
  if (minor > 9) {
    major += Math.floor(minor / 10);
    minor %= 10;
  }
  return `${major}.${minor}.${patch}`;
}

function run(cmd, cwd = root) {
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
}

function main() {
  if (!existsSync(manifestPath)) throw new Error("public/manifest.json not found");

  const original = readFileSync(manifestPath, "utf8");
  const manifest = JSON.parse(original);
  const current = manifest.version;
  const bump = !args.has("--no-bump");
  const target = bump ? nextVersion(current) : current;

  if (args.has("--dry-run")) {
    console.log(`${current} → ${target}`);
    return;
  }

  if (bump) {
    manifest.version = target;
    writeJson(manifestPath, manifest);
    console.log(`\n▶ manifest version ${current} → ${target}`);
  } else {
    console.log(`\n▶ publishing version ${current} (no bump)`);
  }

  try {
    const pkg = readJson(join(root, "package.json"));
    if (!pkg.scripts?.build) throw new Error('package.json has no "build" script');
    console.log(`\n▶ build: ${pkg.scripts.build}`);
    // Run the build command directly: the package manager already put node_modules/.bin on PATH.
    run(pkg.scripts.build);

    console.log("\n▶ domo publish");
    run("domo publish", join(root, "dist"));
  } catch (error) {
    if (bump) {
      writeFileSync(manifestPath, original);
      console.error(`\n✖ Upload failed — manifest version restored to ${current}.`);
    } else {
      console.error("\n✖ Upload failed.");
    }
    process.exit(typeof error.status === "number" ? error.status : 1);
  }

  // First publish: Domo writes the design id into dist/manifest.json.
  if (existsSync(distManifestPath)) {
    const published = readJson(distManifestPath);
    const latest = readJson(manifestPath);
    if (published.id && latest.id !== published.id) {
      latest.id = published.id;
      writeJson(manifestPath, latest);
      console.log(`\n▶ saved design id ${published.id} to public/manifest.json — commit it.`);
    }
  }

  console.log(`\n✔ Published ${manifest.name} v${target} to Domo.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
