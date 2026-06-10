FROM node:20-alpine

WORKDIR /app

# 复制根目录 package.json（workspace 配置）
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/backend/tsconfig.json ./apps/backend/
COPY apps/backend/prisma.config.ts ./apps/backend/
COPY apps/backend/prisma ./apps/backend/prisma/
COPY apps/backend/src ./apps/backend/src/

# 在根目录安装所有依赖（workspace hoisting）
RUN npm install --legacy-peer-deps

# 生成 Prisma Client
RUN cd apps/backend && npx prisma generate

# 编译 TypeScript
RUN cd apps/backend && npx tsc

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "apps/backend/dist/index.js"]
