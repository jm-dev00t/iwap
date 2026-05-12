# IWAP 포트폴리오 요약

## 한 줄 소개

IWAP는 자연어 업무 요청을 Multi-Agent Workflow로 변환해 보고서 생성, Tool 호출, 승인, 알림, 감사 로그까지 실행하는 Spring Boot + Next.js 기반 AI 업무 자동화 플랫폼입니다.

## 면접용 설명

중소기업의 반복 업무를 자동화하는 AI Workflow Platform을 설계하고 구현했습니다. Planner, Executor, Validator, Reporter, Notifier Agent로 책임을 나누고, Tool Adapter 구조를 통해 Slack, Email, CRM, 재고, Kakao 같은 외부 시스템 연동을 확장 가능하게 만들었습니다. 또한 Human-in-the-Loop 승인, WebSocket 실시간 이벤트, Audit Log, Report Artifact를 포함해 실제 기업 PoC에 가까운 구조로 구성했습니다.

## 고객 관점 가치

- 기존 ERP, CRM, 그룹웨어를 교체하지 않고 Adapter 방식으로 연결할 수 있습니다.
- 보고서 작성, 고객 온보딩, 재고 알림, 영업 실적 분석 같은 반복 업무를 자동화합니다.
- 외부 발송이나 구매팀 알림처럼 위험도가 있는 작업은 승인 후 실행합니다.
- 모든 Agent 판단, Tool 호출, 승인 이력을 감사 로그로 추적합니다.
- Mock Provider 기반으로 안정적인 데모가 가능하고, 실제 API 키가 있으면 Real Provider로 확장할 수 있습니다.

## 기술 포인트

- Clean Architecture 패키지 구조
- Multi-Agent orchestration
- Adapter Pattern 기반 Tool Calling 구조
- Spring AI BOM 기반 provider 확장 준비
- PostgreSQL + PGVector + Flyway schema
- WebSocket/STOMP 기반 실시간 workflow event
- Next.js App Router 기반 Command Center와 Dashboard UI
- Docker Compose 및 GitHub Actions CI 구성

## 대표 데모 문장

> 이번 달 매출 보고서를 만들어서 슬랙 채널과 이메일로 보내줘

이 명령 하나로 Planner Agent가 실행 계획을 만들고, Executor Agent가 sales-data/report-generator/slack/email tool을 호출하며, Validator Agent가 결과를 검증하고, Reporter/Notifier Agent가 최종 산출물과 알림을 마무리합니다.
