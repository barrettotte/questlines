### stage 1: build Vue.js frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json .
RUN npm ci

COPY frontend/ .

RUN npm run build

### stage 2: build Go backend
FROM golang:1.24-alpine AS backend-builder

# for CGO
RUN apk add --no-cache build-base gcc musl-dev

WORKDIR /app/questlines
COPY go.* .
RUN go mod download
RUN go mod verify

COPY . .
RUN rm -rf frontend
COPY --from=frontend-builder /app/frontend/dist /app/questlines/frontend/dist

RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -ldflags="-w -s" -o /app/questlines/bin/questlines .
# go-sqlite3 needs CGO_ENABLED=1

### stage 3: build final image
FROM alpine:latest

WORKDIR /app
COPY --from=backend-builder /app/questlines/bin/questlines /app/questlines

EXPOSE 8080
ENTRYPOINT ["/app/questlines", "-db=/app/questlines.db"]
