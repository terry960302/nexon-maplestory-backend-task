FROM node:18-slim AS deps
WORKDIR /usr/src/app

COPY package.json yarn.lock tsconfig.json ./
COPY apps/event-microservice/package.json ./apps/event-microservice/
COPY libs/api-contracts/package.json ./libs/api-contracts/

RUN yarn install --frozen-lockfile --production=false

FROM deps AS builder
WORKDIR /usr/src/app

COPY apps/event-microservice ./apps/event-microservice
COPY libs/api-contracts ./libs/api-contracts

WORKDIR /usr/src/app/apps/event-microservice
RUN yarn build

FROM node:18-slim AS runner
WORKDIR /usr/src/app

# runner 단계에선 production 의존성만 설치해도 됩니다.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production

COPY --from=deps    /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/apps/event-microservice/dist ./dist

CMD ["node", "dist/main.js"]
