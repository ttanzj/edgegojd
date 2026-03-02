import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import yaml from "js-yaml";
import crypto from "crypto";

const app = express();
const PORT = 8080;
const TIMEOUT = 10000;

const SOURCES = fs.readFileSync("./sources.txt", "utf-8")
  .split("\n")
  .map(l => l.trim())
  .filter(Boolean);

// ---------- 工具 ----------
const md5 = s => crypto.createHash("md5").update(s).digest("hex");

async function fetchText(url) {
  return Promise.race([
    fetch(url).then(r => r.text()),
    new Promise((_, r) => setTimeout(() => r(""), TIMEOUT))
  ]);
}

function tryBase64(text) {
  try {
    const d = Buffer.from(text, "base64").toString("utf8");
    if (d.includes("://")) return d;
  } catch {}
  return text;
}

// ---------- URI 直接解析 ----------
function parseURI(text) {
  return text
    .split(/\r?\n/)
    .filter(l => l.match(/^(vmess|vless|trojan|ss|hysteria2?|naive\+https):\/\//));
}

// ---------- Clash / Meta ----------
function parseClash(text) {
  const out = [];
  let doc;
  try { doc = yaml.load(text); } catch { return out; }
  if (!doc?.proxies) return out;

  for (const p of doc.proxies) {
    if (p.type === "vmess") {
      out.push("vmess://" + Buffer.from(JSON.stringify({
        v: "2",
        ps: p.name,
        add: p.server,
        port: p.port,
        id: p.uuid,
        aid: "0",
        net: p.network || "tcp",
        type: "none",
        path: p["ws-opts"]?.path || "/",
        host: p["ws-opts"]?.headers?.Host || "",
        tls: p.tls ? "tls" : ""
      })).toString("base64"));
    }

    if (p.type === "vless") {
      out.push(
        `vless://${p.uuid}@${p.server}:${p.port}?encryption=none#${encodeURIComponent(p.name)}`
      );
    }

    if (p.type === "trojan") {
      out.push(
        `trojan://${p.password}@${p.server}:${p.port}#${encodeURIComponent(p.name)}`
      );
    }

    if (p.type === "ss") {
      const user = Buffer.from(`${p.cipher}:${p.password}`).toString("base64");
      out.push(`ss://${user}@${p.server}:${p.port}#${encodeURIComponent(p.name)}`);
    }
  }
  return out;
}

// ---------- sing-box / xray ----------
function parseJson(text) {
  const out = [];
  let j;
  try { j = JSON.parse(text); } catch { return out; }

  const list = j.outbounds || [];
  for (const o of list) {
    if (o.type === "vmess") {
      out.push("vmess://" + Buffer.from(JSON.stringify({
        v: "2",
        ps: o.tag,
        add: o.server,
        port: o.server_port,
        id: o.uuid,
        aid: "0",
        net: o.transport?.type || "tcp",
        path: o.transport?.path || "/",
        tls: o.tls ? "tls" : ""
      })).toString("base64"));
    }

    if (o.type === "vless") {
      out.push(
        `vless://${o.uuid}@${o.server}:${o.server_port}?encryption=none#${encodeURIComponent(o.tag)}`
      );
    }

    if (o.type === "trojan") {
      out.push(
        `trojan://${o.password}@${o.server}:${o.server_port}#${encodeURIComponent(o.tag)}`
      );
    }

    if (o.type === "hysteria2") {
      out.push(
        `hysteria2://${o.password || ""}@${o.server}:${o.server_port}?insecure=1#${encodeURIComponent(o.tag)}`
      );
    }

    if (o.type === "hysteria") {
      out.push(
        `hysteria://${o.server}:${o.server_port}?auth=${o.auth_str || ""}#${encodeURIComponent(o.tag)}`
      );
    }
  }
  return out;
}

// ---------- 主入口 ----------
app.get("/sub", async (_, res) => {
  const results = await Promise.all(
    SOURCES.map(u => fetchText(u).then(t => {
      t = tryBase64(t);
      return [
        ...parseURI(t),
        ...parseClash(t),
        ...parseJson(t)
      ];
    }))
  );

  const map = new Map();
  results.flat().forEach(n => {
    const h = md5(n);
    if (!map.has(h)) map.set(h, n);
  });

  const final = Buffer
    .from([...map.values()].join("\n"))
    .toString("base64");

  res.type("text/plain").send(final);
});

app.listen(PORT, "0.0.0.0");
