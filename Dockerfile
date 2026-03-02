# 使用官方 Node 18 轻量镜像
FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 拷贝 package.json 并安装依赖
COPY package*.json ./
RUN npm install --production

# 拷贝服务代码
COPY server.js ./

# 对外暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "server.js"]
