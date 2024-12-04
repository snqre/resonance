# Use the official Bun image
FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# Install dependencies (caching them for future builds)
FROM base AS install
COPY package.json bun.lockb /temp/
RUN cd /temp && bun install --frozen-lockfile

# Copy node_modules from install stage and app source code
FROM base AS release
COPY --from=install /temp/node_modules node_modules
COPY . .

# Expose port and set entrypoint for Bun app
USER bun
EXPOSE 8080/tcp
ENTRYPOINT ["bun", "run", "boot"]