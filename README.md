# Edgegojd

Clash 全节点自动聚合服务（支持 Hysteria / Hysteria2 / Xray / Singbox / Clash 多种格式）

## 功能
- 保留全部原始订阅地址（`subscriptions.json` 可自由修改）
- 自动去重 + 失效地址自动跳过
- 每天 00:00 UTC 自动更新节点缓存
- 访问即返回完整 Clash YAML（可直接导入）

## 部署方式（ClawCloud）

1. 在 GitHub 创建仓库 `edgegojd`，把上面所有文件 push 上去。
2. GitHub Action 会自动构建并推送镜像 `ghcr.io/你的用户名/edgegojd:last或latest`。
3. 在 ClawCloud 新建容器：
   - 镜像地址：`ghcr.io/你的用户名/edgegojd:latest`
   - 端口映射：`3000`（容器端口）→ 你想要的宿主机端口（推荐 8080）
4. 启动后访问：

## 访问地址  

订阅地址直接填 → https://你的项目名.run.claw.cloud/

base64 订阅地址 → https://你的项目名.run.claw.cloud/base64

## 修改订阅地址
编辑 `subscriptions.json` → push → GitHub Action 自动重新构建镜像。

## 注意
- 容器内部监听 **3000** 端口
- 推荐 ClawCloud 端口映射为 8080 或 80
- 第一次访问会立即抓取，之后使用缓存，速度极快
- server.js可以输出yaml和base64格式，server.js-back是只yaml格式
- subscriptions.json是整合新版和旧版chromego后的地址，subscriptions.json-是旧版地址，两版都未去除失效链接
- base64订阅大量重复，去重后节点比yaml少
- clawlcoud部署在美国东区会长时间地址不启用，可部署到日本区


所有镜像地址：https://github.com/你的用户名?tab=packages
