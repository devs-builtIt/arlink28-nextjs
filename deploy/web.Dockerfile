# Production image for the Next.js site (apps/web). Build with the monorepo root as the context:
#   docker build -f deploy/web.Dockerfile --build-arg API_URL=http://api:8080 \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://arlink28.com .
#
# API_URL and NEXT_PUBLIC_SITE_URL are read at build time (the /media rewrite and canonical URLs are
# baked in), so they are build args. Neither is a secret. No secret goes into this image.

FROM node:20-alpine AS build
ENV NEXT_TELEMETRY_DISABLED=1 TURBO_TELEMETRY_DISABLED=1 NEXT_OUTPUT=standalone
# The pnpm version comes from package.json "packageManager".
RUN corepack enable
WORKDIR /repo

# Install from the manifests first so this layer is cached until a dependency changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/api-client/package.json packages/api-client/
COPY packages/emails/package.json packages/emails/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

COPY . .
ARG API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV API_URL=$API_URL NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
RUN test -n "$API_URL" && test -n "$NEXT_PUBLIC_SITE_URL" \
    && pnpm exec turbo run build --filter=@arlink28/web

FROM node:20-alpine AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app

# The standalone server is traced from the monorepo root, so it lives under apps/web. Static assets
# and public files are not part of the trace and are copied beside it.
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public

USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
