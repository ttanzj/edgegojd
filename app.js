import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";
import fs from "fs";
import yaml from "js-yaml";

const app = express();
const PORT = 8080;
const TIMEOUT = 8000;

const SOURCES = fs.readFileSync("./sources.txt", "utf-8")
  .split("\n")
  .map(l => l.trim())
  .filter(Boolean);

// ---------- 工具 ----------
async function timeoutFetch(url) {
  return Promise.race([
    fetch(url).then(r => r.text()),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), TIMEOUT)
    )
  ]);
}

function isBase64(text) {
  try {
    return Buffer.from(text, "base64").toString("utf8").includes("://");
  } catch {
    return false;
  }
}

function nodeHash(s) {
  return crypto.createHash("md5").update(s).digest("hex");
}

// ---------- 解析器 ----------

// 1️⃣ Base64 / 明文订阅
function parsePlain(text) {
  if (isBase64(text)) {
    text = Buffer.from(text, "base64").toString("utf8");
  }
  return text
    .split(/\r?\n/)
    .filter(l => l.includes("://"));
}

// 2️⃣ Clash / Meta YAML
function parseClash(text) {
  const out = [];
  const doc = yaml.load(text);
  if (!doc?.proxies) return out;

  for (const p of doc.proxies) {
    if (p.type === "vmess") {
      const v = {
        v: "2",
        ps: p.name,
        add: p.server,
        port: p.port,
        id: p.uuid,
        aid: "0",
        net: p.network || "tcp",
        type: "none",
        host: p["ws-opts"]?.headers?.Host || "",
        path: p["ws-opts"]?.path || "/",
        tls: p.tls ? "tls" : ""
      };
      out.push("vmess://" + Buffer.from(JSON.stringify(v)).toString("base64"));
    }
  }
  return out;
}

// 3️⃣ sing-box / xray JSON
function parseJson(text) {
  const out = [];
  let j;
  try {
    j = JSON.parse(text);
  } catch {
    return out;
  }

  const list = j.outbounds || [];
  for (const o of list) {
    if (o.type === "vless") {
      out.push(
        `vless://${o.uuid}@${o.server}:${o.server_port}?encryption=none#${o.tag || "vless"}`
      );
    }
    if (o.type === "vmess") {
      const v = {
        v: "2",
        ps: o.tag || "vmess",
        add: o.server,
        port: o.server_port,
        id: o.uuid,
        aid: "0",
        net: o.transport?.type || "tcp",
        type: "none",
        path: o.transport?.path || "/",
        tls: o.tls ? "tls" : ""
      };
      out.push("vmess://" + Buffer.from(JSON.stringify(v)).toString("base64"));
    }
  }
  return out;
}

// ---------- 主逻辑 ----------
app.get("/sub", async (_, res) => {
  const results = await Promise.all(
    SOURCES.map(u =>
      timeoutFetch(u)
        .then(t => {
          return [
            ...parsePlain(t),
            ...parseClash(t),
            ...parseJson(t)
          ];
        })
        .catch(() => [])
    )
  );

  const map = new Map();
  results.flat().forEach(n => {
    const h = nodeHash(n);
    if (!map.has(h)) map.set(h, n);
  });

  const merged = [...map.values()].join("\n");
  const encoded = Buffer.from(merged).toString("base64");

  res.type("text/plain").send(encoded);
});

app.listen(PORT, "0.0.0.0", () =>
  console.log("Subscription running on", PORT)
);
