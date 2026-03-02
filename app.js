import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import yaml from "js-yaml";
import crypto from "crypto";
import { execSync } from "child_process";

const app = express();
const PORT = 8080;
const TMP = "/tmp/sb";
const TIMEOUT = 12000;

// 自动创建临时目录
if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

// 读取 sources.txt
const SOURCES = fs.readFileSync("./sources.txt", "utf8")
  .split("\n")
  .map(l => l.trim())
  .filter(Boolean);

function md5(s) {
  return crypto.createHash("md5").update(s).digest("hex");
}

// 拉取源文件
async function fetchText(url) {
  try {
    const r = await fetch(url, { timeout: TIMEOUT });
    if (!r.ok) return "";
    return await r.text();
  } catch {
    return "";
  }
}

// ---------- 解析不同格式 ----------

// Base64 或 URI 直接行
function parseURI(text) {
  if (!text) return [];
  try { text = Buffer.from(text, "base64").toString("utf8"); } catch {}
  return text
    .split(/\r?\n/)
    .filter(l => l.match(/^(vmess|vless|trojan|ss|hysteria2?|naive\+https):\/\//));
}

// Clash / Meta YAML
function parseClash(text) {
  const out = [];
  let doc;
  try { doc = yaml.load(text); } catch { return out; }
  if (!doc?.proxies) return out;

  for (const p of doc.proxies) {
    switch(p.type) {
      case "vmess":
        out.push("vmess://" + Buffer.from(JSON.stringify({
          v:"2", ps:p.name, add:p.server, port:p.port, id:p.uuid,
          aid:"0", net:p.network||"tcp",
          path:p["ws-opts"]?.path||"/",
          host:p["ws-opts"]?.headers?.Host||"",
          tls:p.tls? "tls":""
        })).toString("base64"));
        break;
      case "vless":
        out.push(`vless://${p.uuid}@${p.server}:${p.port}?encryption=none#${encodeURIComponent(p.name)}`);
        break;
      case "trojan":
        out.push(`trojan://${p.password}@${p.server}:${p.port}#${encodeURIComponent(p.name)}`);
        break;
      case "ss":
        const user = Buffer.from(`${p.cipher}:${p.password}`).toString("base64");
        out.push(`ss://${user}@${p.server}:${p.port}#${encodeURIComponent(p.name)}`);
        break;
      case "hysteria":
      case "hysteria2":
        out.push(`${p.type}://${p.password || ""}@${p.server}:${p.port}?insecure=1#${encodeURIComponent(p.name)}`);
        break;
    }
  }
  return out;
}

// sing-box / xray JSON → outbounds
function parseJson(text) {
  const out = [];
  let j;
  try { j = JSON.parse(text); } catch { return out; }
  const list = j.outbounds || [];
  for (const o of list) {
    switch(o.type) {
      case "vmess":
        out.push("vmess://" + Buffer.from(JSON.stringify({
          v:"2", ps:o.tag, add:o.server, port:o.server_port,
          id:o.uuid, aid:"0",
          net:o.transport?.type || "tcp",
          path:o.transport?.path||"/",
          tls:o.tls?"tls":""
        })).toString("base64"));
        break;
      case "vless":
        out.push(`vless://${o.uuid}@${o.server}:${o.server_port}?encryption=none#${encodeURIComponent(o.tag)}`);
        break;
      case "trojan":
        out.push(`trojan://${o.password}@${o.server}:${o.server_port}#${encodeURIComponent(o.tag)}`);
        break;
      case "hysteria":
      case "hysteria2":
        out.push(`${o.type}://${o.password || ""}@${o.server}:${o.server_port}?insecure=1#${encodeURIComponent(o.tag)}`);
        break;
      case "naive+https":
        out.push(`naive+https://${o.user || "user"}@${o.server}:${o.port}#${encodeURIComponent(o.tag)}`);
        break;
    }
  }
  return out;
}

// ---------- 主接口 ----------
app.get("/", (_, res) => {
  res.send("OK\nUse /sub to get subscription");
});

app.get("/sub", async (_, res) => {
  const all = new Map();
  let idx = 0;

  await Promise.all(
    SOURCES.map(async url => {
      const raw = await fetchText(url);
      if (!raw || raw.length < 50) return;

      // 解析各类格式
      const uris = [
        ...parseURI(raw),
        ...parseClash(raw),
        ...parseJson(raw)
      ];

      // 去重
      for (const u of uris) all.set(md5(u), u);
    })
  );

  // 输出 Base64
  const final = Buffer.from([...all.values()].join("\n")).toString("base64");
  res.type("text/plain").send(final);
});

app.listen(PORT, "0.0.0.0", () => console.log("sing-box subscription running on port", PORT));
