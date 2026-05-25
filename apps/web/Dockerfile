FROM node:26-alpine@sha256:7c6af15abe4e3de859690e7db171d0d711bf37d27528eddfe625b2fe89e097f8 AS build
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN corepack enable && pnpm install --filter web... --prod=false && pnpm --filter web build

FROM node:26-alpine@sha256:7c6af15abe4e3de859690e7db171d0d711bf37d27528eddfe625b2fe89e097f8
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_OUTPUT_STANDALONE=true
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000 || exit 1
USER node
CMD ["node", "apps/web/server.js"]
