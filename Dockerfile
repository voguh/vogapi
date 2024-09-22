FROM node:18.20.0-alpine as builder

WORKDIR /vogapi

COPY . .

RUN corepack enable pnpm && pnpm install --frozen-lockfile && pnpm build

FROM node:18.20.0-alpine

WORKDIR /vogapi

COPY --from=builder /vogapi/dist /vogapi/lib
COPY --from=builder /vogapi/public /vogapi/public
COPY --from=builder /vogapi/LICENSE /vogapi/LICENSE
COPY --from=builder /vogapi/package.json /vogapi/package.json
COPY --from=builder /vogapi/pnpm-lock.yaml /vogapi/pnpm-lock.yaml

RUN corepack enable pnpm && pnpm install --frozen-lockfile --prod && mkdir /vogapi/logs

VOLUME [ "/vogapi/logs" ]

CMD ["node", "/vogapi/lib/Main.js"]
