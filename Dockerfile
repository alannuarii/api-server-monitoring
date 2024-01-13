FROM node:18-alpine

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

EXPOSE 3220

CMD ["node", "app.js"]




