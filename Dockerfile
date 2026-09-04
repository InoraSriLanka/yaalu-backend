# Builds a single microservice from this monorepo.
# Usage: docker build --build-arg APP_NAME=auth-service -t yaalu/auth-service .
ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS builder
WORKDIR /usr/src/app

# python3/make/g++ are needed to build bcrypt's native bindings on alpine (musl), openssl for Prisma
RUN apk add --no-cache python3 make g++ openssl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Prisma Client
RUN npx prisma generate

ARG APP_NAME
RUN npx nest build ${APP_NAME}

FROM node:${NODE_VERSION} AS runtime
WORKDIR /usr/src/app
ENV NODE_ENV=production

RUN apk add --no-cache python3 make g++ openssl

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy Prisma schema and generate client for production
COPY prisma ./prisma
RUN npx prisma generate

ARG APP_NAME
ENV APP_NAME=${APP_NAME}

COPY --from=builder /usr/src/app/dist ./dist

CMD ["sh", "-c", "node dist/apps/${APP_NAME}/main.js"]
