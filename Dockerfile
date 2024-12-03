FROM oven/bun:1.0.2
WORKDIR /app
COPY package*.json ./
RUN bun install
COPY . .
CMD ["bun", "boot"]
EXPOSE 3000