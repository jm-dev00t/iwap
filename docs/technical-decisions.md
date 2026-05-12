# Technical Decisions

## Spring Boot 3.4.x

Spring Boot is familiar to enterprise Java teams and fits SI delivery well. Version 3.4.x keeps the stack aligned with the requested portfolio requirement and supports modern observability, Docker Compose integration, and Java 21.

## Spring AI

Spring AI keeps AI provider integration inside the Java/Spring ecosystem. IWAP uses an AI provider abstraction so OpenAI can be enabled with credentials while mock AI keeps demos deterministic.

The project uses the Spring AI 1.0.x stable line and tracks the latest patch release available for that line.

## Next.js 15

Next.js provides a product-grade React foundation with App Router, clean layout composition, and strong portfolio signal. IWAP uses it for a chat-first dashboard rather than a static landing page.

## PGVector

PGVector lets the project demonstrate memory and semantic search without adding a separate vector database. This is easier to explain and easier to run through Docker Compose.

## Mock And Real Providers

Demo stability matters. Email and Slack can be switched to real providers with environment variables, while KakaoWork, CRM, ERP, and inventory connectors start as mock adapters that model enterprise integration boundaries.

## API-First Frontend With Demo Fallback

Portfolio demos must survive partial local setup. The Next.js UI calls the Spring Boot API first, but if the backend is unavailable it renders deterministic demo fallback data. This keeps the product story visible during interviews while preserving the same API contracts used by the real backend.

## Demo Scenario Seed API

The backend exposes `/api/demo-scenarios` and `/api/demo-scenarios/seed` so reviewers can discover and populate the main scenarios directly from Swagger. This makes the backend self-explanatory even without reading the frontend code.
