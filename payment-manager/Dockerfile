FROM node:22-bookworm

WORKDIR /account

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD npm run dev