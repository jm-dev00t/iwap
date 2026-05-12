# 배포 및 운영 가이드

IWAP는 로컬 Docker Compose 실행과 외부 포트폴리오 배포를 모두 지원하도록 구성합니다. 현재 권장 공개 배포 경로는 다음입니다.

- Backend: Render Web Service + Render PostgreSQL
- Frontend: Vercel Next.js
- Mode: `mock` AI/provider 모드로 비용 없이 안정적인 데모 운영

## 로컬 Docker Compose

```powershell
copy .env.example .env
docker compose up --build -d
docker compose ps
```

서비스 주소:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8080/api/health`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

## 주요 환경 변수

| 변수 | 설명 |
| --- | --- |
| `IWAP_BACKEND_PORT` | Spring Boot 서버 포트. 외부 플랫폼의 `PORT`도 fallback으로 지원합니다. |
| `IWAP_DATASOURCE_URL` | JDBC URL. 직접 지정하지 않으면 host/port/database 변수로 조합합니다. |
| `IWAP_DATABASE_HOST` | 배포형 Postgres host |
| `IWAP_DATABASE_PORT` | 배포형 Postgres port |
| `IWAP_DATABASE_NAME` | 배포형 Postgres database |
| `IWAP_DATASOURCE_USERNAME` | Postgres 사용자 |
| `IWAP_DATASOURCE_PASSWORD` | Postgres 비밀번호 |
| `IWAP_ALLOWED_ORIGIN_PATTERNS` | 프론트엔드 도메인 CORS 허용 패턴 |
| `IWAP_DEMO_JWT_SECRET` | Demo JWT 서명 secret |
| `NEXT_PUBLIC_IWAP_API_BASE_URL` | 브라우저에서 호출할 backend API URL |
| `NEXT_PUBLIC_IWAP_WS_URL` | 브라우저에서 연결할 workflow WebSocket URL |
| `IWAP_AI_PROVIDER` | `mock` 또는 실제 AI provider |
| `IWAP_INTEGRATION_MODE` | `mock` 또는 실제 tool adapter 모드 |
| `OPENAI_API_KEY` | 실제 AI provider 사용 시 필요 |
| `SLACK_BOT_TOKEN` | 실제 Slack 발송 사용 시 필요 |
| `SMTP_HOST` | 실제 Email 발송 사용 시 필요 |

## Render Backend 배포

Repository root의 `render.yaml`은 Render Blueprint용입니다. Render 공식 Blueprint는 repository root의 YAML로 web service와 Postgres database를 정의할 수 있고, Postgres의 `host`, `port`, `database`, `user`, `password` 값을 다른 서비스 환경변수로 참조할 수 있습니다.

절차:

1. Render Dashboard에서 `New > Blueprint`를 선택합니다.
2. GitHub repo `jm-dev00t/iwap`를 연결합니다.
3. Blueprint file로 `render.yaml`을 사용합니다.
4. 생성될 `iwap-backend`, `iwap-postgres` 리소스를 확인합니다.
5. 최초 생성 시 `sync: false`로 표시된 secret 값은 비워두거나 실제 값을 입력합니다.
6. 배포 후 backend URL을 확인합니다.

예상 backend URL:

```text
https://iwap-backend.onrender.com
```

Backend 확인:

```powershell
Invoke-RestMethod https://iwap-backend.onrender.com/api/health
```

## Vercel Frontend 배포

Vercel은 monorepo에서 프로젝트 root directory를 지정할 수 있습니다. IWAP 프론트엔드는 `frontend` 폴더가 Next.js 앱 root입니다.

절차:

1. Vercel에서 `New Project`를 선택합니다.
2. GitHub repo `jm-dev00t/iwap`를 import합니다.
3. Root Directory를 `frontend`로 지정합니다.
4. Framework Preset은 `Next.js`로 둡니다.
5. Environment Variables를 추가합니다.

필수 Vercel env:

```text
NEXT_PUBLIC_IWAP_API_BASE_URL=https://iwap-backend.onrender.com
NEXT_PUBLIC_IWAP_WS_URL=wss://iwap-backend.onrender.com/ws/workflows
```

배포 후 frontend URL 예시:

```text
https://iwap.vercel.app
```

## CORS 설정

Vercel 배포 URL이 확정되면 Render backend의 `IWAP_ALLOWED_ORIGIN_PATTERNS`를 실제 도메인에 맞춰 좁히는 것을 권장합니다.

초기 배포용:

```text
https://*.vercel.app,https://*.onrender.com
```

도메인 확정 후:

```text
https://iwap.vercel.app
```

환경변수 변경 후에는 Render backend를 재배포합니다.

## 배포 Smoke Test

Backend:

```powershell
$api = "https://iwap-backend.onrender.com"
$health = Invoke-RestMethod "$api/api/health"
$manager = Invoke-RestMethod "$api/api/auth/demo-login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"role":"MANAGER"}'

$headers = @{ Authorization = "Bearer $($manager.accessToken)" }
Invoke-RestMethod "$api/api/tools" -Headers $headers
```

Frontend:

```text
https://<your-vercel-project>.vercel.app
```

Command Center에서 `Run workflow`를 누른 뒤 `Backend API`와 `Live events`가 표시되면 API와 WebSocket 연결이 모두 동작하는 상태입니다.

## 운영 고려사항

- 포트폴리오 공개 데모는 `mock` provider를 기본으로 둡니다.
- 실제 Slack/Email 발송은 Human-in-the-Loop 승인 정책 뒤에서만 활성화합니다.
- `IWAP_DEMO_JWT_SECRET`은 배포 환경마다 고유한 값으로 설정합니다.
- Render 무료 인스턴스는 cold start가 있을 수 있으므로 첫 요청이 느릴 수 있습니다.
- PostgreSQL 데이터는 Flyway schema와 JPA store로 관리되며 workflow history, approvals, artifacts, audit logs를 재시작 후에도 복원합니다.
