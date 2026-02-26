
FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package.json .
RUN npm install --production

# 复制主程序
COPY index.js .

# 对外端口
EXPOSE 3000

# 启动
CMD ["node", "index.js"]
