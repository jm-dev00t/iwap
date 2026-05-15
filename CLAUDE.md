# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. No Closing Colons (Korean Output)

**End Korean sentences with a period, not a colon.**

When the user writes in Korean, your output is also Korean:
- Don't end sentences with `:` even if the next line is a list or example.
- LLMs trained on English docs leak the colon habit into Korean. Catch it.
- The test: every Korean sentence terminator should be `.`, `?`, or `!` — not `:`.
- Colons are fine inside code, key-value pairs, or labels. Not as sentence enders.

## 6. File Header Comments in Korean

**First line of every new source file: a one-line Korean comment stating its role.**

When creating a new file:
- TypeScript/JavaScript: `// 사용자 인증 상태를 관리하는 Context Provider`
- Python: `# KIS API 호출을 비동기로 래핑하는 클라이언트`
- SQL: `-- 일별 집계 결과를 저장하는 머티리얼라이즈드 뷰`
- Place it directly under required directives (`'use client'`, `'use server'`, shebang).
- Skip config files (`*.config.ts`, `package.json`, etc.).

Why: agents read files selectively, not whole codebases. A one-line Korean header gives instant context so the next session (human or agent) can navigate without re-reading the entire file.

## 7. Plan + Checklist + Context Notes

**Before any non-trivial task, produce three artifacts. Don't start coding without them.**

- **Plan** — what we're building and why.
- **Checklist** (`checklist.md`) — concrete tasks as checkboxes. Tick as you go.
- **Context Notes** (`context-notes.md`) — decisions made during the work and the reasoning behind them. Append continuously.

If the user gives only a plan and asks you to start coding, stop and ask: "Should I create the checklist and context notes first?" The next session — yours or someone else's — needs the notes to pick up where you left off without re-deriving every decision.

## 8. Run Tests Before Marking Complete

**If you touched code, run the tests before saying "done".**

- `npm test`, `pytest`, `cargo test`, whatever the project uses — run it.
- If tests pass, report results. If they fail, fix and re-run.
- No test setup? At minimum, verify the project builds/compiles.
- Run tests proactively, before the user signals "끝", "완료", "다 됐어" — not after.

This is the step LLMs skip most often. Treat it as non-negotiable.

## 9. Semantic Commits

**Commit when one logical change is complete. Don't wait for the user to ask.**

- The test: "Can I describe this commit in one sentence?" If yes, commit. If no, the changes are still mixed — split them.
- Good: "auth 미들웨어 추가". Bad: "auth 추가하고 UI도 고치고 버그도 수정" (split into 3).
- Don't accumulate 20 unrelated edits and lose the ability to roll back individually.
- Don't commit just to commit — meaningful units only.

Note: For solo prototypes or throwaway scripts, group commits loosely if it slows you down. The point is reversibility, not ceremony.

## 10. Read Errors, Don't Guess

**Read the actual error/log line. Don't pattern-match from memory.**

When something fails:
- Read the full error message and stack trace.
- Check the actual log output, not what you assume it should say.
- Don't apply a "common fix" before confirming the cause.
- If unclear, add a print/log to verify state — then fix.

This is the step LLMs skip most often after "run tests". They guess from error keywords and apply the most-recent-pattern fix. That's how a one-line bug becomes a three-file refactor.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# IWAP — 프로젝트 컨텍스트

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

## 주요 서비스 진입점

- **채팅 플로우:** `AssistantController` → `AssistantService` → `AssistantPlanner` → `WorkflowOrchestrator`
  - 상태 기계: `AssistantState` (COLLECTING → PLANNING → AWAITING_APPROVAL → EXECUTING)
  - `application/agent/` 내 Agent 클래스들은 `WorkflowOrchestrator`가 호출 — 직접 호출 금지
- **외부 발송:** `application/delivery/DeliveryService` — Slack/Email 실제 발송 담당
- **인프라 어댑터:** `infrastructure/tools/` — DeliveryService가 호출하는 vendor 어댑터

## 코드 규칙

- 한국어 주석 허용 (한국어 도메인이므로)
- 하드코딩 응답 금지 — 데이터는 반드시 출처가 있어야 함
- 새 환경변수는 반드시 `.env.example`에 추가
- API 응답은 기존 DTO 패턴 유지
- Mock/Real 분기는 `@ConditionalOnProperty` 사용
- `IWAP_AI_PROVIDER=mock|openai`: mock은 결정론적 데모 플래너, openai는 Spring AI 기반 LLM 플래너
  - openai 사용 시 `IWAP_SPRING_AI_CHAT_MODEL=openai`, `OPENAI_API_KEY` 추가 필요
- `IWAP_INTEGRATION_MODE=mock|real`: real이어도 SMTP/Slack 자격증명 없으면 도구 호출 결과에 실패 기록
- 세션/플랜 저장소는 인메모리 (`InMemoryAssistantSessionStore`, `InMemoryAssistantPlanStore`) — 서버 재시작 시 초기화 의도적

## 작업 완료 시 규칙

**각 작업이 끝날 때마다 `README.md`의 "작업 현황" 섹션을 업데이트한다.**

```markdown
| 작업명 | ✅ 완료 | 2026-05-xx |
```

## 현재 진행 중인 작업 (2026-05-15)

설계 문서: `docs/superpowers/specs/2026-05-15-iwap-enhancement-design.md`

| Phase | 작업 | 상태 |
|-------|------|------|
| 1 | 소스 데이터 뷰어 페이지 | ✅ 완료 |
| 1 | Agent 실제 동작 + 상태 기계 | ✅ 완료 |
| 1 | Slack/Email 실제 발송 어댑터 | ✅ 완료 |
| 2 | OpenAI 플래너 완성 | 🔄 다음 작업 |

## 테스트

```powershell
# 백엔드
cd backend && mvn test

# 프론트엔드
cd frontend && npm run typecheck && npm run lint && npm run build
```
