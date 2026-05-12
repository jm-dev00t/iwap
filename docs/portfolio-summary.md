# IWAP 포트폴리오 요약

## 한 줄 소개

자연어 업무 지시를 Multi-Agent Workflow로 변환해 보고서 생성, CRM 기록, Slack/Email/Kakao 알림, 승인 기반 실행, 감사 로그까지 자동화하는 Spring Boot + Next.js 기반 지능형 업무 자동화 플랫폼입니다.

## 이력서용 설명

Spring Boot 3.4, Spring AI, Next.js 15, PostgreSQL, PGVector를 활용해 중소기업의 반복 업무를 자동화하는 AI Workflow Platform을 설계하고 구현했습니다. Planner, Executor, Validator, Reporter, Notifier Agent로 역할을 분리하고, Tool Calling Adapter 구조를 통해 Email, Slack, CRM, KakaoWork, Google Sheets 등 외부 시스템 연동을 확장 가능하게 설계했습니다. Human-in-the-Loop 승인, WebSocket 기반 진행 이벤트, Audit Log, Mock/Real Provider 분리 구조를 포함해 실제 기업 자동화 PoC에 가까운 포트폴리오 프로젝트로 구성했습니다.

## 위시켓용 설명

기존 ERP, CRM, 그룹웨어, 엑셀 업무를 유지하면서 AI Agent를 옆에 붙여 반복 업무를 자동화하는 하이브리드형 AI 업무 자동화 플랫폼입니다. 자연어로 “이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘”처럼 요청하면 Agent들이 업무 계획을 세우고, 필요한 Tool을 호출하며, 위험 작업은 승인 후 진행하고, 모든 실행 내역을 감사 로그로 남깁니다.

## 고객 설득 포인트

- 기존 시스템을 교체하지 않고 REST API, DB View, CSV/Excel, Webhook 방식으로 연동 가능
- 보고서 작성, 고객 온보딩, 재고 알림, 영업 실적 분석 같은 실제 업무 시나리오 중심
- 외부 발송/구매 관련 작업은 Human-in-the-Loop 승인으로 통제
- Mock Provider로 안정적인 데모 가능, 실제 API 키가 있으면 Real Provider로 확장 가능
- Agent 판단, Tool 호출, 승인 내역을 Audit Log로 추적 가능

## 면접에서 설명할 기술 포인트

- Clean Architecture 기반 패키지 분리
- LangGraph 스타일의 상태 기반 Agent Orchestration
- Adapter Pattern으로 외부 시스템 연동 분리
- PGVector 기반 Memory/RAG 확장 고려
- WebSocket/STOMP 기반 실시간 진행 상황 스트리밍 설계
- Next.js App Router 기반 Command Center와 Dashboard UI
- Docker Compose 기반 로컬 실행 환경

## 대표 데모 문장

“이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘”

이 명령 하나로 Planner Agent가 계획을 만들고, Executor Agent가 데이터를 읽고 리포트와 알림 Tool을 호출하며, Validator Agent가 결과를 검증하고, Reporter/Notifier Agent가 최종 보고와 완료 알림을 처리합니다.
