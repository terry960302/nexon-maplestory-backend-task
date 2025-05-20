FROM node:18-alpine AS deps
WORKDIR /usr/src/app

COPY package.json yarn.lock tsconfig.json ./
COPY apps/gateway/package.json ./apps/gateway/
COPY libs/api-contracts/package.json ./libs/api-contracts/

RUN yarn install --frozen-lockfile --production=false

FROM deps AS builder
WORKDIR /usr/src/app

COPY apps/gateway ./apps/gateway
COPY libs/api-contracts ./libs/api-contracts

WORKDIR /usr/src/app/apps/gateway
RUN yarn build

FROM node:18-alpine AS runner
WORKDIR /usr/src/app

COPY --from=deps    /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/gateway/dist ./dist

CMD ["node", "dist/main.js"]
