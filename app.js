import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import { execSync } from "child_process";
import crypto from "crypto";

const app = express();
const PORT = 8080;
const TIMEOUT = 12000;
const TMP = "/tmp/sb";

if (!fs.existsSync(TMP)) fs.mkdirSync(TMP, { recursive: true });

const SOURCES = fs.readFileSync("./sources.txt", "utf8")
  .split("\n")
  .map(l => l.trim())
  .filter(Boolean);

function md5(s) {
  return crypto.createHash("md5").update(s).digest("hex");
}

async function fetchText(url) {
  try {
    const r = await fetch(url, { timeout: TIMEOUT });
    if (!r.ok) return "";
    return await r.text();
  } catch {
    return "";
  }
}

/**
 * 将任意配置包裹成最小 sing-box 配置
 */
function wrapToSingboxConfig(raw) {
  return {
    log: { disabled: true },
    inbounds: [],
    outbounds: [
      {
        type: "direct",
        tag: "direct"
      }
    ],
    experimental: {
      cache_file: { enabled: false }
    },
    _import: raw
  };
}

/**
 * 调用 sing-box 官方解析
 */
function parseBySingbox(configText, idx) {
  const inFile = `${TMP}/in-${idx}.json`;
  fs.writeFileSync(inFile, configText);

  try {
    execSync(`sing-box check -c ${inFile}`, { stdio: "ignore" });
    const json = JSON.parse(fs.readFileSync(inFile, "utf8"));
    return json.outbounds || [];
  } catch {
    return [];
  }
}

/**
 * sing-box outbound → URI
 */
function outboundToURI(o) {
  if (o.type === "vmess") {
    return "vmess://" + Buffer.from(JSON.stringify({
      v: "2",
      ps: o.tag || "vmess",
      add: o.server,
      port: o.server_port,
      id: o.uuid,
      aid: "0",
      net: o.transport?.type || "tcp",
      path: o.transport?.path || "/",
      tls: o.tls ? "tls" : ""
    })).toString("base64");
  }

  if (o.type === "vless") {
    return `vless://${o.uuid}@${o.server}:${o.server_port}?encryption=none#${encodeURIComponent(o.tag || "vless")}`;
  }

  if (o.type === "trojan") {
    return `trojan://${o.password}@${o.server}:${o.server_port}#${encodeURIComponent(o.tag || "trojan")}`;
  }

  if (o.type === "hysteria2") {
    return `hysteria2://${o.password || ""}@${o.server}:${o.server_port}?insecure=1#${encodeURIComponent(o.tag || "hysteria2")}`;
  }

  if (o.type === "hysteria") {
    return `hysteria://${o.server}:${o.server_port}?auth=${o.auth_str || ""}#${encodeURIComponent(o.tag || "hysteria")}`;
  }

  return null;
}

// ------------------ 路由 ------------------

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

      const wrapped = wrapToSingboxConfig(raw);
      const outbounds = parseBySingbox(JSON.stringify(wrapped), idx++);

      for (const o of outbounds) {
        const uri = outboundToURI(o);
        if (uri) all.set(md5(uri), uri);
      }
    })
  );

  const final = Buffer
    .from([...all.values()].join("\n"))
    .toString("base64");

  res.type("text/plain").send(final);
});

app.listen(PORT, "0.0.0.0", () =>
  console.log("sing-box subscription running on", PORT)
);
