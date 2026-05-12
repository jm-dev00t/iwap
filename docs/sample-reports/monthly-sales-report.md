# 월간 매출 자동화 리포트 샘플

## Executive Summary

2026년 5월 매출은 B2B Direct 채널이 가장 높은 기여도를 보였고, Online Store는 주문 수 기준으로 가장 활발했습니다. Partner Reseller 채널은 매출 규모는 작지만 전월 대비 안정적인 증가 흐름을 보였습니다.

## 주요 지표

| 채널 | 매출 | 주문 수 | 매출총이익률 |
| --- | ---: | ---: | ---: |
| B2B Direct | 84,200,000원 | 42 | 38% |
| Online Store | 31,500,000원 | 128 | 31% |
| Partner Reseller | 27,600,000원 | 19 | 27% |

## Agent 처리 결과

- Planner Agent: 월간 매출 분석, 리포트 생성, Slack/Email 발송 계획 수립
- Executor Agent: 매출 데이터 조회, 리포트 생성, Slack/Email Tool 호출
- Validator Agent: 필수 지표와 수신 대상 검증
- Reporter Agent: 경영진 요약 리포트 생성
- Notifier Agent: 완료 알림 및 감사 로그 기록

## 추천 액션

1. B2B Direct 채널의 고마진 고객군을 별도 세그먼트로 관리합니다.
2. Online Store는 주문 수가 많으므로 자동 알림과 재구매 캠페인을 연결합니다.
3. Partner Reseller는 리드타임과 마진을 함께 모니터링합니다.
