# ---- Build stage: install deps and build client + server ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json tsconfig.server.json vite.config.ts index.html ./
COPY src ./src
COPY server ./server
COPY public ./public

RUN npm run build

# ---- Runtime stage: slim image with only prod deps + built output ----
FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/server-dist ./server-dist
COPY data ./data

EXPOSE 3000

CMD ["node", "server-dist/index.js"]
