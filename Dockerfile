FROM node:12.14.0-alpine

RUN apk add --no-cache bash

WORKDIR /usr/app

COPY package*.json ./

RUN npm install --quiet

COPY . .

CMD ["npm", "start"]
