FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/website/package.json ./apps/website/
COPY packages/db/package.json ./packages/db/

RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "--filter", "website", "dev"]