# ── Build stage ────────────────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ARG http_proxy
ARG https_proxy
ARG no_proxy
# Which portal folders to bundle.
# Provide PORTAL_FOLDERS from outside via --build-arg as a comma-separated list.
# Use a single entry to only build one folder, e.g. 'portal/master'.
ARG PORTAL_FOLDERS
ARG PORTAL_FOLDER

ENV HTTP_PROXY=$HTTP_PROXY
ENV HTTPS_PROXY=$HTTPS_PROXY
ENV NO_PROXY=$NO_PROXY
ENV http_proxy=$http_proxy
ENV https_proxy=$https_proxy
ENV no_proxy=$no_proxy
# Prefer IPv4 for DNS + allow enough heap for a big Vite build
ENV NODE_OPTIONS="--dns-result-order=ipv4first --max-old-space-size=4096"

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .
# Build non-interactively: skip the readline wrapper and call Vite directly
# PORTAL_FOLDERS supports comma-separated paths from repo root.
# PORTAL_FOLDER is still supported for backward compatibility.
RUN PORTAL_FOLDERS="${PORTAL_FOLDERS:-${PORTAL_FOLDER:-}}" && \
  [ -n "$PORTAL_FOLDERS" ] || (echo "PORTAL_FOLDERS (or PORTAL_FOLDER) must be provided" && exit 1) && \
  PORTAL_FOLDERS="$PORTAL_FOLDERS" ./node_modules/.bin/vite build \
      --config devtools/vite.config.js \
      --mode production

# ── Runtime stage ──────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Copy compiled static assets
COPY --from=build /app/dist /usr/share/nginx/html

# nginx official image processes /etc/nginx/templates/*.template with envsubst
# on startup and writes results to /etc/nginx/conf.d/
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

# Default backend service name (Kubernetes ClusterIP DNS)
ENV BACKEND_SERVICE_URL=masterportal-backend

EXPOSE 3001
