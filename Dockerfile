FROM node:18.20.0-alpine as builder

WORKDIR /vogapi

COPY . .

RUN yarn install && yarn build

FROM node:18.20.0-alpine

WORKDIR /vogapi

COPY --from=builder /vogapi/dist /vogapi/lib
COPY --from=builder /vogapi/public /vogapi/public
COPY --from=builder /vogapi/LICENSE /vogapi/LICENSE
COPY --from=builder /vogapi/package.json /vogapi/package.json
COPY --from=builder /vogapi/privacy-policy.md /vogapi/privacy-policy.md

RUN yarn install --production && mkdir /vogapi/logs

VOLUME [ "/vogapi/config", "/vogapi/logs" ]

CMD ["node", "/vogapi/lib/Main.js"]
