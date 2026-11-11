#!/usr/bin/env node
// Check the built theme against the VS Code installed on this machine:
// every UI color key must be one VS Code (or a built-in extension) registers,
// and every value must be #RRGGBB or #RRGGBBAA.
//
//   npm run check
//   VSCODE_APP="/path/to/Visual Studio Code.app" npm run check

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const themeFile = join(root, "themes", "ayu-dark-emc-color-theme.json");
const app = process.env.VSCODE_APP ?? "/Applications/Visual Studio Code.app";
const appRoot = join(app, "Contents", "Resources", "app");

if (!existsSync(appRoot)) {
  console.error(`VS Code not found at ${app}; set VSCODE_APP.`);
  process.exit(2);
}

const bundle = readFileSync(join(appRoot, "out", "vs", "workbench", "workbench.desktop.main.js"), "utf8");
const contributed = new Set();
const extDir = join(appRoot, "extensions");
for (const name of readdirSync(extDir)) {
  const pkg = join(extDir, name, "package.json");
  if (!existsSync(pkg)) continue;
  for (const col of JSON.parse(readFileSync(pkg, "utf8")).contributes?.colors ?? []) {
    contributed.add(col.id);
  }
}

const theme = JSON.parse(readFileSync(themeFile, "utf8"));
const keys = Object.keys(theme.colors);
const unknown = keys.filter((k) => !contributed.has(k) && !bundle.includes(`"${k}"`));
const badValue = Object.entries(theme.colors).filter(([, v]) => !/^#[0-9A-F]{6}([0-9A-F]{2})?$/i.test(v));
const badToken = theme.tokenColors.filter((r) =>
  r.settings.foreground && !/^#[0-9A-F]{6}([0-9A-F]{2})?$/i.test(r.settings.foreground));

console.log(`${keys.length} UI keys, ${theme.tokenColors.length} token rules`);
for (const k of unknown) console.log(`  unknown key: ${k}`);
for (const [k, v] of badValue) console.log(`  bad value: ${k} = ${v}`);
for (const r of badToken) console.log(`  bad token color: ${r.name}`);

const problems = unknown.length + badValue.length + badToken.length;
console.log(problems ? `${problems} problem(s)` : "OK");
process.exit(problems ? 1 : 0);
