# IWAP — Claude 작업 가이드

## 프로젝트 개요

IWAP(Intelligent Workflow Automation Platform)는 자연어 업무 자동화를 보여주는 B2B 포트폴리오 데모 플랫폼이다.

## 기술 스택

- **백엔드:** Spring Boot 3.4.x, Java 21, Spring AI, PostgreSQL 16, Flyway
- **프론트엔드:** Next.js, TypeScript, Tailwind CSS, TanStack Query
- **인프라:** Docker Compose, WebSocket/STOMP, JWT 인증

## 로컬 실행

```powershell
docker compose up -d --build
# Frontend: http://localhost:3000
# Backend:  http://localhost:8080
# Swagger:  http://localhost:8080/swagger-ui.html
```

## 계층 구조 (반드시 준수)

```
domain/        → 순수 비즈니스 모델 (외부 의존 없음)
application/   → 유스케이스, Agent, 오케스트레이션
infrastructure/ → JPA, 보안, WebSocket, 외부 어댑터
interfaces/    → REST Controller, DTO
```

- 상위 계층이 하위 계층을 의존하지 않는다 (domain은 아무것도 의존하지 않음)
- 새 기능은 반드시 올바른 계층에 추가한다

## 코드 규칙

- 한국어 주석 허용 (한국어 도메인이므로)
- 하드코딩 응답 금지 — 데이터는 반드시 출처가 있어야 함
- 새 환경변수는 반드시 `.env.example`에 추가
- API 응답은 기존 DTO 패턴 유지
- Mock/Real 분기는 `@ConditionalOnProperty` 사용

## 작업 완료 시 규칙

**각 작업이 끝날 때마다 `README.md`의 "작업 현황" 섹션을 업데이트한다.**

```markdown
| 작업명 | ✅ 완료 | 2026-05-xx |
```

## 현재 진행 중인 작업 (2026-05-15)

설계 문서: `docs/superpowers/specs/2026-05-15-iwap-enhancement-design.md`

| Phase | 작업 | 방식 |
|-------|------|------|
| 1 (병렬) | 소스 데이터 뷰어 페이지 | 프론트엔드 |
| 1 (병렬) | Agent 실제 동작 + 상태 기계 | 백엔드 |
| 1 (병렬) | Slack/Email 실제 발송 어댑터 | 백엔드 인프라 |
| 2 (순차) | OpenAI 플래너 완성 | 백엔드 (Phase 1 완료 후) |

## 테스트

```powershell
# 백엔드
cd backend && mvn test

# 프론트엔드
cd frontend && npm run typecheck && npm run lint && npm run build
```
