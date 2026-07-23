#!/usr/bin/env node
// Reads .sync/index.json and generates root README.md with stats

const fs = require("fs");
const path = require("path");

const INDEX_PATH = path.join(process.cwd(), ".sync", "index.json");

if (!fs.existsSync(INDEX_PATH)) {
  console.log("No .sync/index.json found, creating empty README");
  writeReadme({ total: 0, easy: 0, medium: 0, hard: 0, byLanguage: {}, problems: [] });
  process.exit(0);
}

const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf-8"));
const entries = Object.values(index);

const stats = {
  total: entries.length,
  easy: entries.filter(e => e.difficulty === "Easy").length,
  medium: entries.filter(e => e.difficulty === "Medium").length,
  hard: entries.filter(e => e.difficulty === "Hard").length,
  byLanguage: {},
  problems: entries
};

// Count by language
for (const entry of entries) {
  for (const approach of entry.approaches) {
    stats.byLanguage[approach.language] = (stats.byLanguage[approach.language] ?? 0) + 1;
  }
}

writeReadme(stats);
console.log(`README updated: ${stats.total} problems`);

function progressBar(value, total, width = 20) {
  if (total === 0) return "░".repeat(width);
  const filled = Math.round((value / total) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

function writeReadme(stats) {
  const langTable = Object.entries(stats.byLanguage)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, count]) => `| ${lang} | ${count} |`)
    .join("\n");

  const problemTable = (stats.problems || [])
    .sort((a, b) => a.title?.localeCompare(b.title ?? "") ?? 0)
    .map(e => {
      const langs = [...new Set(e.approaches.map(a => a.language))].join(", ");
      const approaches = e.approaches.length;
      return `| [${e.title}](${e.path}/README.md) | ${e.difficulty} | ${langs} | ${approaches} |`;
    })
    .join("\n");

  const total = stats.total;
  const easy = stats.easy;
  const medium = stats.medium;
  const hard = stats.hard;

  const readme = `# 🚀 DSA Solutions

Auto-synced from LeetCode / GeeksforGeeks via [CodeSync Chrome Extension](https://github.com).

## 📊 Stats

| Metric | Count |
|--------|-------|
| Total Problems | **${total}** |
| Easy | 🟢 ${easy} \`${progressBar(easy, total)}\` |
| Medium | 🟡 ${medium} \`${progressBar(medium, total)}\` |
| Hard | 🔴 ${hard} \`${progressBar(hard, total)}\` |

## 🌐 Languages

| Language | Solutions |
|----------|-----------|
${langTable || "| — | — |"}

## 📋 Problems

| Problem | Difficulty | Languages | Approaches |
|---------|------------|-----------|------------|
${problemTable || "| No problems yet | — | — | — |"}

---
_Last updated: ${new Date().toISOString().split("T")[0]}_
`;

  fs.writeFileSync(path.join(process.cwd(), "README.md"), readme, "utf-8");
}
