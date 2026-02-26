import axios from "axios"
import yaml from "js-yaml"
import http from "http"

/* ======== 你的全部订阅源（一个不漏） ======== */

const SOURCES = [
  "https://www.gitlabip.xyz/Alvin9999/pac2/master/singbox/1/config.json",
  "https://gitlab.com/free9999/ipupdate/-/raw/master/singbox/config.json",
  "https://www.githubip.xyz/Alvin9999/pac2/master/singbox/config.json",
  "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/singbox/config.json",

  "https://gitlab.com/free9999/ipupdate/-/raw/master/quick/3/config.yaml",
  "https://www.gitlabip.xyz/Alvin9999/pac2/master/quick/3/config.yaml",
  "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/quick/4/config.yaml",
  "https://www.gitlabip.xyz/Alvin9999/pac2/master/quick/1/config.yaml",
  "https://gitlab.com/free9999/ipupdate/-/raw/master/quick/config.yaml",
  "https://www.githubip.xyz/Alvin9999/pac2/master/quick/config.yaml",
  "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/quick/config.yaml",
  "https://www.githubip.xyz/Alvin9999/pac2/master/quick/4/config.yaml",

  "https://www.gitlabip.xyz/Alvin9999/pac2/master/xray/1/config.json",
  "https://www.githubip.xyz/Alvin9999/pac2/master/xray/config.json",
  "https://www.githubip.xyz/Alvin9999/pac2/master/xray/2/config.json",
  "https://gitlab.com/free9999/ipupdate/-/raw/master/xray/config.json",
  "https://gitlab.com/free9999/ipupdate/-/raw/master/xray/2/config.json",
  "https://www.gitlabip.xyz/Alvin9999/pac2/master/xray/3/config.json",
  "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/xray/config.json",

  "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/clash/2/config.json",

  "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/clash.meta2/config.yaml",
  "https://www.githubip.xyz/Alvin9999/pac2/master/clash.meta2/config.yaml",
  "https://gitlab.com/free9999/ipupdate/-/raw/master/clash.meta2/2/config.yaml",
  "https://www.gitlabip.xyz/Alvin9999/pac2/master/clash.meta2/15/config.yaml",
  "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/clash.meta2/2/config.yaml",
  "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/clash.meta2/3/config.yaml",
  "https://www.githubip.xyz/Alvin9999/pac2/master/clash.meta2/3/config.yaml",
  "https://www.gitlabip.xyz/Alvin9999/pac2/master/clash.meta2/13/config.yaml",
  "https://www.gitlabip.xyz/Alvin9999/pac2/master/clash.meta2/1/config.yaml",
  "https://www.githubip.xyz/Alvin9999/pac2/master/clash.meta2/2/config.yaml",
  "https://gitlab.com/free9999/ipupdate/-/raw/master/clash.meta2/config.yaml",
  "https://gitlab.com/free9999/ipupdate/-/raw/master/clash.meta2/3/config.yaml",

  "https://www.gitlabip.xyz/Alvin9999/pac2/master/hysteria/1/config.json",
  "https://gitlab.com/free9999/ipupdate/-/raw/master/hysteria/2/config.json",
  "https://www.githubip.xyz/Alvin9999/pac2/master/hysteria/2/config.json",
  "https://www.githubip.xyz/Alvin9999/pac2/master/hysteria/config.json",
  "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/hysteria/config.json",
  "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/hysteria/2/config.json",
  "https://gitlab.com/free9999/ipupdate/-/raw/master/hysteria/config.json",
  "https://www.gitlabip.xyz/Alvin9999/pac2/master/hysteria/13/config.json",

  "https://gitlab.com/free9999/ipupdate/-/raw/master/hysteria2/2/config.json",
  "https://www.githubip.xyz/Alvin9999/pac2/master/hysteria2/config.json",
  "https://www.githubip.xyz/Alvin9999/pac2/master/hysteria2/2/config.json",
  "https://www.gitlabip.xyz/Alvin9999/pac2/master/hysteria2/1/config.json",
  "https://gitlab.com/free9999/ipupdate/-/raw/master/hysteria2/config.json",
  "https://www.gitlabip.xyz/Alvin9999/pac2/master/hysteria2/13/config.json",
  "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/hysteria2/2/config.json",
  "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/hysteria2/config.json",

  "https://fastly.jsdelivr.net/gh/jsvpn/jsproxy@dev/yule/20200325/1299699.md",
  "https://www.githubip.xyz/jsvpn/jsproxy/dev/yule/20200325/1299699.md",

  "https://fastly.jsdelivr.net/gh/Alvin9999/PAC@latest/naiveproxy/config.json",
  "https://gitlab.com/free9999/ipupdate/-/raw/master/naiveproxy/config.json",
  "https://www.githubip.xyz/Alvin9999/PAC/master/naiveproxy/config.json",
  "https://www.gitlabip.xyz/Alvin9999/PAC/master/naiveproxy/1/config.json"
]

/* ======== 节点池 ======== */
const nodes = new Map()

/* ======== 工具 ======== */

function add(uri) {
  try {
    const u = new URL(uri.replace(/^([a-z0-9+.-]+):\/\//i, "http://"))
    if (!u.hostname || !u.port) return
    if (["localhost", "127.0.0.1", "0.0.0.0"].includes(u.hostname)) return
    const key = `${uri.split("://")[0]}|${u.hostname}|${u.port}|${u.username}`
    nodes.set(key, uri)
  } catch {}
}

function parseAny(obj) {
  if (!obj) return
  if (Array.isArray(obj)) return obj.forEach(parseAny)
  if (typeof obj !== "object") return

  if (obj.type && obj.server && obj.port) {
    const id = obj.uuid || obj.password || ""
    switch (obj.type) {
      case "vmess":
        add(`vmess://${Buffer.from(JSON.stringify({
          v: "2", ps: obj.name || obj.server,
          add: obj.server, port: obj.port, id
        })).toString("base64")}`)
        break
      case "vless":
      case "trojan":
      case "ss":
        add(`${obj.type}://${id}@${obj.server}:${obj.port}`)
        break
      case "hysteria2":
      case "hy2":
        add(`hysteria2://${id}@${obj.server}:${obj.port}`)
        break
    }
  }

  Object.values(obj).forEach(parseAny)
}

/* ======== 拉取 & 解析 ======== */

async function loadAll() {
  for (const url of SOURCES) {
    try {
      const { data } = await axios.get(url, { timeout: 15000 })
      let content = data

      if (typeof content === "string") {
        if (/^[A-Za-z0-9+/=\s]+$/.test(content.trim())) {
          content = Buffer.from(content, "base64").toString()
        }
        try {
          content = yaml.load(content)
        } catch {
          content.split("\n").forEach(l => l.includes("://") && add(l.trim()))
          continue
        }
      }

      parseAny(content)
    } catch {}
  }
}

await loadAll()

/* ======== HTTP 输出 ======== */

http.createServer((req, res) => {
  const list = [...nodes.values()].join("\n")
  if (req.url === "/base64") {
    res.end(Buffer.from(list).toString("base64"))
  } else {
    res.end(list)
  }
}).listen(3000)

console.log("✅ Node extractor running at :3000")
