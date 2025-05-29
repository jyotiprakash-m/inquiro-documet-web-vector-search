FROM node:20.17.0-alpine

# Install Python and Poppler
# RUN apk add --no-cache python3 py3-pip poppler-utils

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

WORKDIR /app

COPY --chmod=0777 public ./public
COPY --chmod=0777 .next/standalone ./
COPY --chmod=0777 .next/static ./.next/static

USER node

CMD ["node", "server.js"]