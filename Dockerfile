FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist/quantity-measurement-app-frontend/browser /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

ENV API_UPSTREAM=http://host.docker.internal:8080
ENV OAUTH_UPSTREAM=http://host.docker.internal:8081

EXPOSE 80
