import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import prettier from "prettier";

const formatBase = process.env.FORMAT_BASE;

function changedFileOutput() {
  if (formatBase && !/^0+$/.test(formatBase)) {
    try {
      return execFileSync(
        "git",
        ["diff", "--name-only", "--diff-filter=ACMR", `${formatBase}...HEAD`],
        { encoding: "utf8" }
      );
    } catch {
      console.warn(
        "The requested comparison base is unavailable; checking local changes instead."
      );
    }
  }

  return execFileSync(
    "git",
    ["diff", "--name-only", "--diff-filter=ACMR", "HEAD"],
    {
      encoding: "utf8",
    }
  );
}

const changedFiles = changedFileOutput().split("\n").filter(Boolean);
const untrackedFiles = execFileSync(
  "git",
  ["ls-files", "--others", "--exclude-standard"],
  { encoding: "utf8" }
)
  .split("\n")
  .filter(Boolean);
const supportedExtensions = /\.(css|html|js|json|md|mjs|ts|tsx|ya?ml)$/;
const files = [...new Set([...changedFiles, ...untrackedFiles])]
  .filter(file => supportedExtensions.test(file))
  .filter(file => file !== "pnpm-lock.yaml");

if (files.length === 0) {
  console.log("No supported changed files require formatting checks.");
  process.exit(0);
}

let hasError = false;
for (const file of files) {
  try {
    const text = await fs.readFile(file, "utf8");
    const options = await prettier.resolveConfig(file);
    const isFormatted = await prettier.check(text, {
      ...options,
      filepath: file,
    });
    if (!isFormatted) {
      console.error(`[Prettier] ${file} is not formatted.`);
      hasError = true;
    }
  } catch {
    // If file was deleted or cannot be read, skip
  }
}

if (hasError) {
  console.error("Code formatting check failed. Run `pnpm format` to fix.");
  process.exit(1);
} else {
  console.log("All changed files match Prettier code style!");
}
