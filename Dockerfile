FROM node:20-alpine

WORKDIR /app

# 安装基础工具
RUN apk add --no-cache curl unzip bash

# 安装 sing-box（官方二进制）
RUN curl -L https://github.com/SagerNet/sing-box/releases/latest/download/sing-box-linux-amd64.tar.gz \
 | tar zx \
 && mv sing-box-*/sing-box /usr/local/bin/sing-box \
 && chmod +x /usr/local/bin/sing-box

COPY package.json .
RUN npm install --production

COPY app.js sources.txt ./

EXPOSE 8080
CMD ["node", "app.js"]
