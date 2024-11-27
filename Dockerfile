FROM node:20-alpine

ENV PORT=8080

WORKDIR /app

COPY . .
RUN npm ci

EXPOSE 8080

CMD ["npm", "run", "start"]
