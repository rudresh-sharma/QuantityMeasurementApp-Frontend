# QuantityMeasurementApp Frontend

Angular frontend for the Quantity Measurement microservices.

## Features

- Login and signup flow
- Google sign-in redirect support
- Quantity conversion, comparison, and arithmetic
- Local history persistence in the browser
- Docker-ready nginx setup for serving the SPA and proxying backend APIs

## Local development

1. Start your backend gateway on `http://localhost:8080`.
2. Install dependencies with `npm install`.
3. Run the frontend with `npm start`.

The Angular dev server uses [`proxy.conf.json`](/c:/Users/ASUS/OneDrive/Desktop/QuantityMeasurementApp-Frontend/proxy.conf.json) so frontend calls to `/api` and `/oauth2` stay same-origin and are forwarded to the backend services.

## Production build

Run:

```bash
npm run build
```

## Docker

Build the image:

```bash
docker build -t quantity-measurement-frontend .
```

Run the container:

```bash
docker run -p 4200:80 -e API_UPSTREAM=http://host.docker.internal:8080 quantity-measurement-frontend
```

`API_UPSTREAM` should point to the backend gateway or reverse proxy that exposes `/api`.
`OAUTH_UPSTREAM` should point to the authentication service that exposes `/oauth2`.

## Render deployment

`render.yaml` is configured to deploy this app as a Docker-based web service so nginx can:

- serve the Angular SPA
- proxy `/api/*` to `API_UPSTREAM`
- proxy `/oauth2/*` to `OAUTH_UPSTREAM`

This avoids browser-side cross-origin calls in production and keeps the production request flow aligned with local Docker usage.

## Docker Compose

This project now includes [`docker-compose.yml`](/c:/Users/ASUS/OneDrive/Desktop/QuantityMeasurementApp-Frontend/docker-compose.yml) to:

- build the frontend from this folder
- pull these backend images from Docker Hub:
  - `crazydev7/admin-server:latest`
  - `crazydev7/authentication-service:latest`
  - `crazydev7/quantity-measurement-service:latest`
  - `crazydev7/api-gateway:latest`

Run:

```bash
docker compose up --build
```

Stop:

```bash
docker compose down
```

Frontend will be available at `http://localhost:4200` and the gateway at `http://localhost:8080`.

If your backend images require extra Spring environment variables for Eureka, database, JWT, or OAuth configuration, add them under the relevant service in the compose file.

## Important routes

- Frontend app: `/`
- Google OAuth callback page: `/oauth-success`
- Backend auth endpoints: `/api/v1/auth/*`
- Backend quantity endpoints: `/api/v1/quantities/*`
