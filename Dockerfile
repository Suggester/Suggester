FROM node:lts-alpine

WORKDIR /usr/src/app

RUN apk add git
RUN git init

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY . .

RUN git submodule add https://github.com/suggester/i18n.git i18n
RUN git submodule update --init --recursive

USER node

CMD npm run start
