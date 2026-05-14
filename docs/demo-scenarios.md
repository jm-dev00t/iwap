# IWAP 데모 시나리오

이 문서는 `http://localhost:3000` 화면과 `http://localhost:8080` API에서 실제로 확인 가능한 데모 흐름만 정리합니다.

## 1. 월간 매출 보고서 자동화

| 항목 | 값 |
| --- | --- |
| 화면 표시명 | 월간 매출 보고서 자동화 |
| API title | `Monthly Sales Report Automation` |
| scenarioKey | `monthly-sales-report` |
| 명령 | `이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘` |
| 상태 | `COMPLETED` |
| 도구 호출 | `sales-data`, `report-generator`, `slack`, `email` |
| 산출물 | 마크다운 보고서 1건 |

시연 포인트:

- 매출 데이터 조회, 보고서 생성, 슬랙/이메일 공유 흐름을 한 번에 보여줍니다.
- 실제 외부 발송은 하지 않고, 도구 호출 이력과 감사 로그로 남깁니다.
- 보고서 화면에서 생성된 마크다운 산출물을 확인할 수 있습니다.

## 2. 신규 고객 온보딩 자동화

| 항목 | 값 |
| --- | --- |
| 화면 표시명 | 신규 고객 온보딩 자동화 |
| API title | `New Customer Onboarding` |
| scenarioKey | `customer-onboarding` |
| 명령 | `신규 고객 등록 후 환영 이메일 보내고, 고객 관리 시스템에 기록하고, 담당자에게 알림` |
| 상태 | `COMPLETED` |
| 도구 호출 | `crm`, `email`, `slack` |
| 산출물 | 없음 |

시연 포인트:

- 신규 고객 등록, 환영 이메일, 담당자 알림이 한 워크플로로 묶이는 모습을 보여줍니다.
- 고객 관리 시스템은 실제 CRM 호출이 아니라 모의 어댑터 이력으로 표현합니다.

## 3. 재고 부족 구매팀 알림

| 항목 | 값 |
| --- | --- |
| 화면 표시명 | 재고 부족 구매팀 알림 |
| API title | `Low Inventory Purchasing Alert` |
| scenarioKey | `low-inventory` |
| 명령 | `재고 부족 제품 리스트 뽑아서 구매팀 카카오톡으로 보내` |
| 상태 | `WAITING_FOR_APPROVAL` |
| 도구 호출 | 승인 전에는 없음 |
| 승인 요청 | 1건 생성 |

시연 포인트:

- 구매팀 알림처럼 실제 업무 영향이 큰 작업은 바로 실행하지 않고 승인 대기 상태로 멈춥니다.
- 승인함 화면에서 승인/반려 버튼을 눌러 상태 변화를 확인할 수 있습니다.

## 4. 주간 영업 리포트 생성

| 항목 | 값 |
| --- | --- |
| 화면 표시명 | 주간 영업 리포트 생성 |
| API title | `Weekly Sales Performance Report` |
| scenarioKey | `weekly-sales-report` |
| 명령 | `주간 영업 실적 분석해서 PDF 리포트 생성 후 공유` |
| 상태 | `COMPLETED` |
| 도구 호출 | `sales-data`, `report-generator`, `email` |
| 산출물 | PDF 보고서 1건 |

시연 포인트:

- 주간 실적 분석, PDF 보고서 생성, 공유 준비 흐름을 보여줍니다.
- 현재는 실제 PDF 파일 렌더링이 아니라 PDF 형식 산출물 메타데이터와 본문을 저장합니다.

## 데모 중 주의할 점

- 화면에는 한글 표시명이 보이고, API 응답의 `title`, `status`, `toolName`은 계약값이라 영어/코드값이 섞여 있습니다.
- 슬랙, 이메일, 카카오워크, 고객 관리 시스템은 실제 외부 발송이 아니라 모의 어댑터입니다.
- 기본 데모에는 외부 API 키가 필요하지 않습니다.
