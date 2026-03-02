FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY app.js sources.txt ./

EXPOSE 8080

CMD ["node", "app.js"]
