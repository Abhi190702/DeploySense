FROM node:20-alpine AS build
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN corepack enable && pnpm install --filter api... --prod=false && pnpm --filter api build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3001
HEALTHCHECK CMD wget -qO- http://localhost:3001/api/health || exit 1
USER node
CMD ["node", "dist/index.js"]
