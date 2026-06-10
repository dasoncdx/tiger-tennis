FROM node:20-alpine

WORKDIR /app

# 只复制 backend 目录内的文件（Zeabur 构建上下文是 apps/backend）
COPY package.json ./
COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma/
COPY src ./src/

# 安装依赖
RUN npm install --legacy-peer-deps

# 生成 Prisma Client
RUN npx prisma generate

# 编译 TypeScript
RUN npx tsc

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
