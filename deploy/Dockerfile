# Multi-stage production container with embedded Litestream binary
FROM node:22-alpine AS base

# Install Litestream
FROM base AS litestream-builder
ARG LITESTREAM_VERSION=v0.3.13
ADD https://github.com/benbjohnson/litestream/releases/download/${LITESTREAM_VERSION}/litestream-${LITESTREAM_VERSION}-linux-amd64.tar.gz /tmp/litestream.tar.gz
RUN tar -C /usr/local/bin -xzf /tmp/litestream.tar.gz

# Next.js Runner Stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=litestream-builder /usr/local/bin/litestream /usr/local/bin/litestream
COPY deploy/litestream.yml /etc/litestream.yml
COPY deploy/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Standalone build output
COPY public ./public
COPY .next/standalone ./
COPY .next/static ./.next/static

RUN mkdir -p /data

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
