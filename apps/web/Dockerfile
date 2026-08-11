FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# Used by docker-compose for local development: full node_modules + source,
# hot reload via `next dev` (docker-compose mounts the source as a volume).
FROM deps AS dev
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM deps AS builder
WORKDIR /app
# NEXT_PUBLIC_* vars are inlined into the client bundle at build time, so this
# must be passed as --build-arg when building the production image (e.g. in CI),
# not just set as a runtime env var on the container.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
COPY . .
RUN npm run build

# Production image (used by Terraform/ECS): standalone output only, no
# devDependencies or source tree.
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
