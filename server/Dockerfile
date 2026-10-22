FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN chown -R node:node /app
USER node
EXPOSE 4300
CMD ["sh","-c","npm run migrate && npm run seed && npm start"]
