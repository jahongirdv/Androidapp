#stage 0 server
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
COPY wait-for-it.sh ./
RUN chmod +x wait-for-it.sh
CMD ["sh", "-c", "./wait-for-it.sh postgres:5432 -- node db/seed.js && node index.js"]
