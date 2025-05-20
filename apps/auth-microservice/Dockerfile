FROM node:18-slim AS deps
WORKDIR /usr/src/app

COPY package.json yarn.lock tsconfig.json ./
COPY apps/auth-microservice/package.json ./apps/auth-microservice/
COPY libs/api-contracts/package.json ./libs/api-contracts/

RUN yarn install --frozen-lockfile --production=false

FROM deps AS builder
WORKDIR /usr/src/app

COPY apps/auth-microservice ./apps/auth-microservice
COPY libs/api-contracts ./libs/api-contracts

WORKDIR /usr/src/app/apps/auth-microservice
RUN yarn build

# 실행
FROM node:18-slim AS runner
WORKDIR /usr/src/app

COPY --from=deps    /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/auth-microservice/dist ./dist

CMD ["node", "dist/main.js"]
