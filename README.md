# Zambia Integrated Digital ID & Civil Registry (ZIDCR)

This repository contains the microservices-based Digital Identity and Civil Registration ecosystem for Zambia.

## Architecture & Tech Stack

- **Backend**: Spring Boot (Java) for Core Identity Service; FastAPI (Python) for Biometric Processing.
- **Frontend**: React (Vite) with Tailwind CSS and ShadcnUI for the Admin Dashboard.
- **Mobile**: Flutter for a cross-platform citizen wallet and field registration app.
- **Databases**: PostgreSQL (Primary), Neo4j (Lineage/Family Tree), Redis (Caching).
- **Integration**: RabbitMQ for asynchronous event-driven communication.
- **Security**: OAuth 2.0 / OpenID Connect, AES-256 (At-rest), TLS 1.3 (In-transit), ECDSA P-256 (Signing).

## Directory Structure

- `api-docs/`: OpenAPI 3.0 Specifications for the microservices.
- `db-init/`: Initial database schemas (PostgreSQL and Neo4j).
- `core-id-service/`: Spring Boot service for Identity Generation and Signing.
- `biometric-service/`: FastAPI service for processing biometric captures.
- `admin-dashboard/`: React (Vite) frontend for ZIDCR administration.
- `citizen-wallet/`: Flutter mobile application for citizens.
- `gsb-gateway/`: Middleware API to integrate with external banks/services.

## Step-by-Step Execution Plan

### Phase 1: Database & API Contracts (Completed)
- Define OpenAPI specs (`api-docs/openapi.yaml`).
- Set up PostgreSQL schemas for Citizens, Vital Events, and Audit Logs (`db-init/init.sql`).
- Set up `docker-compose.yml` for infrastructure (PostgreSQL, Neo4j, Redis, RabbitMQ).

### Phase 2: The Core ID Engine (Completed)
- Implemented `core-id-service` Spring Boot scaffolding.
- Implemented `biometric-service` FastAPI scaffolding.
- Implemented UCI generation and cryptographic signing service (ECDSA P-256) in the Core Identity Service.

### Phase 3: The Citizen Wallet (Completed)
- Built the Flutter app capable of storing the signed ID.
- Displays a dynamic QR code for offline verification containing the ECDSA signature.
- Prepared local storage structure for field registration in low-connectivity areas.

### Phase 4: GSB Mock & Sandbox (Completed)
- Built a mock Government Service Bus (`gsb-gateway`) using FastAPI.
- Implemented the `/api/v1/gsb/verify` endpoint.
- Simulates external agency (Bank, Telecom) verification of the Citizen's Offline QR Token.

## Getting Started

1. Copy `.env.example` to `.env` and fill in secure passwords and keys:
   ```bash
   cp .env.example .env
   ```

2. Start the core infrastructure services:
   ```bash
   docker-compose up -d
   ```
