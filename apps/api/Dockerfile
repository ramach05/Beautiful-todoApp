# syntax=docker/dockerfile:1
# Build context is the monorepo root: docker build -f apps/api/Dockerfile .

FROM node:24-alpine AS build
WORKDIR /repo
RUN corepack enable
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/config/package.json packages/config/
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @bt/api...
COPY packages packages
COPY apps/api apps/api
RUN pnpm --filter @bt/shared --filter @bt/api build
# Self-contained prod artifact with flattened dependencies (including @bt/shared)
RUN pnpm deploy --legacy --filter=@bt/api --prod /deploy/api

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
USER node
COPY --from=build --chown=node:node /deploy/api ./
EXPOSE 3001
CMD ["node", "dist/index.js"]
