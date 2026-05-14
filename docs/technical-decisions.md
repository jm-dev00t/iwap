# Technical Decisions

## Spring Boot 3.4.x

Spring Boot is familiar to enterprise Java teams and fits SI delivery well. Version 3.4.x keeps the stack aligned with the requested portfolio requirement and supports modern observability, Docker Compose integration, and Java 21.

## Spring AI

Spring AI keeps AI provider integration inside the Java/Spring ecosystem. IWAP uses an AI provider abstraction so OpenAI can be enabled with credentials while mock AI keeps demos deterministic.

## Next.js 15

Next.js provides a product-grade React foundation with App Router, clean layout composition, and strong portfolio signal. IWAP uses it for a chat-first dashboard rather than a static landing page.

## PGVector

PGVector lets the project demonstrate memory and semantic search without adding a separate vector database. This is easier to explain and easier to run through Docker Compose.

## Mock And Real Providers

Demo stability matters. Email and Slack can be switched to real providers with environment variables, while KakaoWork, CRM, ERP, and inventory connectors start as mock adapters that model enterprise integration boundaries.
