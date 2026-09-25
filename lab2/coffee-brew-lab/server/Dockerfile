FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/uploads

EXPOSE 4000

CMD ["node", "dist/index.js"]
