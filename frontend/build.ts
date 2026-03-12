#!/usr/bin/env bun
import plugin from "bun-plugin-tailwind";
import { existsSync } from "fs";
import { rm } from "fs/promises";
import path from "path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
🏗️  Bun Build Script

Usage: bun run build.ts [options]

Common Options:
  --outdir <path>          Output directory (default: "dist")
  --minify                 Enable minification (or --minify.whitespace, --minify.syntax, etc)
  --sourcemap <type>      Sourcemap type: none|linked|inline|external
  --target <target>        Build target: browser|bun|node
  --format <format>        Output format: esm|cjs|iife
  --splitting              Enable code splitting
  --packages <type>        Package handling: bundle|external
  --public-path <path>     Public path for assets
  --env <mode>             Environment handling: inline|disable|prefix*
  --conditions <list>      Package.json export conditions (comma separated)
  --external <list>        External packages (comma separated)
  --banner <text>          Add banner text to output
  --footer <text>          Add footer text to output
  --define <obj>           Define global constants (e.g. --define.VERSION=1.0.0)
  --help, -h               Show this help message

Example:
  bun run build.ts --outdir=dist --minify --sourcemap=linked --external=react,react-dom
`);
  process.exit(0);
}

const toCamelCase = (str: string): string => str.replace(/-([a-z])/g, g => (g[1] ? g[1].toUpperCase() : ""));

const parseValue = (value: string): any => {
  if (value === "true") return true;
  if (value === "false") return false;

  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d*\.\d+$/.test(value)) return parseFloat(value);

  if (value.includes(",")) return value.split(",").map(v => v.trim());

  return value;
};

function parseArgs(): Partial<Bun.BuildConfig> {
  const config: Record<string, any> = {};
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined) continue;
    if (!arg.startsWith("--")) continue;

    if (arg.startsWith("--no-")) {
      const key = toCamelCase(arg.slice(5));
      config[key] = false;
      continue;
    }

    if (!arg.includes("=") && (i === args.length - 1 || args[i + 1]?.startsWith("--"))) {
      const key = toCamelCase(arg.slice(2));
      config[key] = true;
      continue;
    }

    let key: string;
    let value: string;

    if (arg.includes("=")) {
      [key, value] = arg.slice(2).split("=", 2) as [string, string];
    } else {
      key = arg.slice(2);
      value = args[++i] ?? "";
    }

    key = toCamelCase(key);

    if (key.includes(".")) {
      const parts = key.split(".");
      const parentKey = parts[0]!;
      const childKey = parts[1]!;
      config[parentKey] = config[parentKey] || {};
      config[parentKey][childKey] = parseValue(value);
    } else {
      config[key] = parseValue(value);
    }
  }

  return config;
}

const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

console.log("\n🚀 Starting build process...\n");

const cliConfig = parseArgs();
const outdir = cliConfig.outdir || path.join(process.cwd(), "dist");

if (existsSync(outdir)) {
  console.log(`🗑️ Cleaning previous build at ${outdir}`);
  await rm(outdir, { recursive: true, force: true });
}

const start = performance.now();

const entrypoints = [...new Bun.Glob("**.html").scanSync("src")]
  .map(a => path.resolve("src", a))
  .filter(dir => !dir.includes("node_modules"));
console.log(`📄 Found ${entrypoints.length} HTML ${entrypoints.length === 1 ? "file" : "files"} to process\n`);

const mode = (cliConfig as any).mode || "production";
const envFile = `.env.${mode}`;
console.log(`🌍 Loading environment for mode: ${mode} from ${envFile}`);

const define: Record<string, string> = {
  "process.env.NODE_ENV": JSON.stringify(mode === "development" ? "development" : "production"),
  "process.env": "{}",
  "process": "({ env: {} })",
};

if (existsSync(envFile)) {
  const file = Bun.file(envFile);
  const text = await file.text();
  text.split("\n").forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) return;
    const [key, ...rest] = trimmedLine.split("=");
    if (key && key.startsWith("BUN_PUBLIC_")) {
      const value = rest.join("=").trim();
      const stringifiedValue = JSON.stringify(value);
      define[`process.env.${key}`] = stringifiedValue;
      define[`globalThis.process.env.${key}`] = stringifiedValue;
      define[`import.meta.env.${key}`] = stringifiedValue;
      console.log(`🔹 Injected ${key}`);
    }
  });
}

const result = await Bun.build({
  entrypoints,
  outdir,
  plugins: [plugin],
  minify: mode !== "development",
  target: "browser",
  sourcemap: "linked",
  define: {
    ...define,
    ...(cliConfig.define || {}),
  },
  ...cliConfig,
});

// Copy PWA assets to outdir
const pwaAssets = [
  "manifest.json", 
  "sw.js", 
  "assets/icon-192x192.png", 
  "assets/icon-512x512.png",
  "assets/screenshot-wide.png",
  "assets/screenshot-mobile.png"
];
for (const asset of pwaAssets) {
  const assetPath = path.join("src", asset);
  if (existsSync(assetPath)) {
    const destPath = path.join(outdir, asset);
    await Bun.write(destPath, Bun.file(assetPath));
    console.log(`📦 Copied ${asset} to ${outdir}`);
  }
}

const end = performance.now();

const outputTable = result.outputs.map(output => ({
  File: path.relative(process.cwd(), output.path),
  Type: output.kind,
  Size: formatFileSize(output.size),
}));

console.table(outputTable);
const buildTime = (end - start).toFixed(2);

console.log(`\n✅ Build completed in ${buildTime}ms\n`);
