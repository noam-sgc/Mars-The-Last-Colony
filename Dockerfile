FROM node:22-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev || npm install --omit=dev
COPY . .
ENV PORT=8080 DATA_DIR=/data NODE_ENV=production
VOLUME /data
EXPOSE 8080
HEALTHCHECK CMD wget -qO- http://localhost:8080/healthz || exit 1
CMD ["node", "server/server.js"]
