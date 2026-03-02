import express from 'express'
import fetch from 'node-fetch'
import yaml from 'js-yaml'

const app = express()
const PORT = process.env.PORT || 3000

app.get('/sub', async (req, res) => {
  try {
    const uniqueStrings = new Set()

    const sites = [
      // =================== hysteria ===================
      { url: "https://www.gitlabip.xyz/Alvin9999/pac2/master/hysteria/1/config.json", type: "hysteria" },
      { url: "https://gitlab.com/free9999/ipupdate/-/raw/master/hysteria/config.json", type: "hysteria" },
      { url: "https://www.githubip.xyz/Alvin9999/pac2/master/hysteria/config.json", type: "hysteria" },
      { url: "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/hysteria/config.json", type: "hysteria" },
      { url: "https://www.gitlabip.xyz/Alvin9999/pac2/master/hysteria/13/config.json", type: "hysteria" },
      { url: "https://gitlab.com/free9999/ipupdate/-/raw/master/hysteria/2/config.json", type: "hysteria" },
      { url: "https://www.githubip.xyz/Alvin9999/pac2/master/hysteria/2/config.json", type: "hysteria" },
      { url: "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/hysteria/2/config.json", type: "hysteria" },

      // =================== hysteria2 ===================
      { url: 'https://www.gitlabip.xyz/Alvin9999/pac2/master/hysteria2/1/config.json', type: "hysteria2" },
      { url: 'https://gitlab.com/free9999/ipupdate/-/raw/master/hysteria2/config.json', type: "hysteria2" },
      { url: 'https://www.githubip.xyz/Alvin9999/pac2/master/hysteria2/config.json', type: "hysteria2" },
      { url: 'https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/hysteria2/config.json', type: "hysteria2" },
      { url: 'https://www.gitlabip.xyz/Alvin9999/pac2/master/hysteria2/13/config.json', type: "hysteria2" },
      { url: 'https://gitlab.com/free9999/ipupdate/-/raw/master/hysteria2/2/config.json', type: "hysteria2" },
      { url: 'https://www.githubip.xyz/Alvin9999/pac2/master/hysteria2/2/config.json', type: "hysteria2" },
      { url: 'https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/hysteria2/2/config.json', type: "hysteria2" },

      // =================== xray ===================
      { url: 'https://www.gitlabip.xyz/Alvin9999/pac2/master/xray/1/config.json', type: "xray" },
      { url: 'https://gitlab.com/free9999/ipupdate/-/raw/master/xray/config.json', type: "xray" },
      { url: 'https://www.githubip.xyz/Alvin9999/pac2/master/xray/config.json', type: "xray" },
      { url: 'https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/xray/config.json', type: "xray" },
      { url: 'https://www.gitlabip.xyz/Alvin9999/pac2/master/xray/3/config.json', type: "xray" },
      { url: 'https://gitlab.com/free9999/ipupdate/-/raw/master/xray/2/config.json', type: "xray" },
      { url: 'https://www.githubip.xyz/Alvin9999/pac2/master/xray/2/config.json', type: "xray" },

      // =================== singbox ===================
      { url: "https://gitlab.com/free9999/ipupdate/-/raw/master/singbox/config.json", type: "singbox" },
      { url: "https://www.githubip.xyz/Alvin9999/pac2/master/singbox/config.json", type: "singbox" },
      { url: "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/singbox/config.json", type: "singbox" },
      { url: "https://www.gitlabip.xyz/Alvin9999/pac2/master/singbox/1/config.json", type: "singbox" },

      // =================== clash ===================
      { url: "https://gitlab.com/free9999/ipupdate/-/raw/master/clash.meta2/config.yaml", type: "clash" },
      { url: "https://www.githubip.xyz/Alvin9999/pac2/master/clash.meta2/config.yaml", type: "clash" },
      { url: "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/clash.meta2/config.yaml", type: "clash" },
      { url: "https://www.gitlabip.xyz/Alvin9999/pac2/master/clash.meta2/13/config.yaml", type: "clash" },
      { url: "https://gitlab.com/free9999/ipupdate/-/raw/master/clash.meta2/2/config.yaml", type: "clash" },
      { url: "https://www.githubip.xyz/Alvin9999/pac2/master/clash.meta2/2/config.yaml", type: "clash" },
      { url: "https://fastly.jsdelivr.net/gh/Alvin9999/pac2@latest/clash.meta2/2/config.yaml", type: "clash" },

      // =================== naive ===================
      { url: "https://www.gitlabip.xyz/Alvin9999/PAC/master/naiveproxy/1/config.json", type: "naive" },
      { url: "https://gitlab.com/free9999/ipupdate/-/raw/master/naiveproxy/config.json", type: "naive" },
      { url: "https://www.githubip.xyz/Alvin9999/PAC/master/naiveproxy/config.json", type: "naive" },
      { url: "https://fastly.jsdelivr.net/gh/Alvin9999/PAC@latest/naiveproxy/config.json", type: "naive" },
    ]

    await Promise.all(sites.map(site => fetchData(site, uniqueStrings)))

    const mergedContent = Array.from(uniqueStrings).join('\n')
    const base64Str = Buffer.from(mergedContent, 'utf-8').toString('base64')

    res.setHeader('Content-Type', 'text/plain')
    res.send(base64Str)

  } catch (err) {
    console.error(err)
    res.status(500).send('Internal Server Error')
  }
})

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/sub`))

/***************** Helper Functions *****************/

async function fetchData(site, set) {
  try {
    const res = await fetch(site.url)
    if (!res.ok) return

    if (site.type === 'clash') {
      const text = await res.text()
      const data = yaml.load(text)
      processClash(data, set)
    } else {
      const data = await res.json()
      switch(site.type){
        case 'hysteria': processHysteria(data,set); break
        case 'hysteria2': processHysteria2(data,set); break
        case 'xray': processXray(data,set); break
        case 'singbox': processSingbox(data,set); break
        case 'naive': processNaive(data,set); break
      }
    }
  } catch (err) {
    console.error(`Error fetching ${site.url}:`, err.message)
  }
}

// 以下处理函数保留最初 Worker 逻辑
function processHysteria(data,set){
  const s = `hysteria://${data.server}?upmbps=${data.up_mbps}&downmbps=${data.down_mbps}&auth=${data.auth_str}&insecure=1&peer=${data.server_name}&alpn=${data.alpn}`
  set.add(s)
}
function processHysteria2(data,set){
  const insecure = data.tls?.insecure ? 1 : 0
  const s = `hysteria2://${data.auth}@${data.server}?insecure=${insecure}&sni=${data.tls?.sni||''}`
  set.add(s)
}
function processXray(data,set){
  const out = data.outbounds[0]
  const proto = out.protocol
  const id = out.settings?.vnext?.[0]?.users?.[0]?.id
  const addr = out.settings?.vnext?.[0]?.address
  const port = out.settings?.vnext?.[0]?.port
  const security = out.streamSettings?.security||''
  const sni = out.streamSettings?.tlsSettings?.serverName||''
  const fp = out.streamSettings?.tlsSettings?.fingerprint||'chrome'
  const net = out.streamSettings?.network
  const path = out.streamSettings?.wsSettings?.path
  const host = out.streamSettings?.wsSettings?.headers?.Host
  const s = `${proto}://${id}@${addr}:${port}?security=${security}&sni=${sni}&fp=${fp}&type=${net}&path=${path}&host=${host}`
  set.add(s)
}
function processSingbox(data,set){
  const out = data.outbounds[0]
  const s = `hysteria://${out.server}:${out.server_port}?upmbps=${out.up_mbps}&downmbps=${out.down_mbps}&auth=${out.auth_str}&insecure=1&peer=${out.tls.server_name}&alpn=${out.tls.alpn[0]}`
  set.add(s)
}
function processNaive(data,set){
  set.add(Buffer.from(data.proxy,'utf-8').toString('base64'))
}
function processClash(data,set){
  if(!data.proxies) return
  data.proxies.forEach(proxy=>{
    let s=''
    switch(proxy.type){
      case 'hysteria':
        s = `hysteria://${proxy.server}:${proxy.port}?peer=${proxy.sni}&upmbps=${proxy.up}&downmbps=${proxy.down}&auth=${proxy['auth-str']}&obfs=${proxy.obfs}&mport=${proxy.port}&protocol=${proxy.protocol}&fastopen=${proxy.fast_open}&insecure=1&alpn=${proxy.alpn[0]}`
        break
      case 'vless':
        s = `vless://${proxy.uuid}@${proxy.server}:${proxy.port}?security=${proxy.tls?'tls':'none'}&type=${proxy.network}`
        break
      case 'vmess':
        s = `vmess://${proxy.uuid}@${proxy.server}:${proxy.port}?security=${proxy.tls?'tls':'none'}&type=${proxy.network}`
        break
      case 'ss':
        const ss = Buffer.from(`${proxy.cipher}:${proxy.password}`).toString('base64')
        s = `ss://${ss}@${proxy.server}:${proxy.port}`
        break
      case 'ssr':
        const ssr = Buffer.from(`${proxy.server}:${proxy.port}:${proxy.protocol}:${proxy.cipher}:${proxy.obfs}:${proxy.password}`).toString('base64')
        s = `ssr://${ssr}`
        break
    }
    if(s) set.add(s)
  })
}
