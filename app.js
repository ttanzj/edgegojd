import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";

const app = express();
const PORT = 8080;
const TIMEOUT = 8000;

import fs from "fs";
const SOURCES = fs.readFileSync("./sources.txt", "utf-8")
  .split("\n")
  .map(l => l.trim())
  .filter(Boolean);

// ---------- 工具 ----------
function timeoutFetch(url) {
  return Promise.race([
    fetch(url).then(r => r.text()),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), TIMEOUT)
    )
  ]);
}

function tryBase64Decode(text) {
  try {
    const d = Buffer.from(text, "base64").toString("utf-8");
    if (d.includes("://")) return d;
  } catch {}
  return null;
}

// 提取节点行
function extractLines(text) {
  const out = new Set();

  const decoded = tryBase64Decode(text);
  if (decoded) text = decoded;

  text.split(/\r?\n/).forEach(l => {
    if (l.includes("://")) out.add(l.trim());
  });

  return [...out];
}

// 节点指纹（去重核心）
function nodeFingerprint(node) {
  try {
    const u = new URL(node);
    const key =
      u.protocol +
      "|" +
      u.hostname +
      "|" +
      (u.port || "") +
      "|" +
      (u.username || "") +
      "|" +
      (u.password || "");
    return crypto.createHash("md5").update(key).digest("hex");
  } catch {
    return crypto.createHash("md5").update(node).digest("hex");
  }
}

// ---------- 路由 ----------
app.get("/sub", async (_, res) => {
  const tasks = SOURCES.map(url =>
    timeoutFetch(url)
      .then(text => extractLines(text))
      .catch(() => [])
  );

  const results = await Promise.all(tasks);

  const nodeMap = new Map();

  results.flat().forEach(n => {
    const fp = nodeFingerprint(n);
    if (!nodeMap.has(fp)) nodeMap.set(fp, n);
  });

  const merged = [...nodeMap.values()].join("\n");
  const encoded = Buffer.from(merged).toString("base64");

  res.set("Content-Type", "text/plain");
  res.send(encoded);
});

app.get("/", (_, res) => {
  res.send("OK /sub");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("running on", PORT);
});