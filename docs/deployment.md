# 배포 및 운영 가이드

## 로컬 Docker Compose

IWAP의 로컬 데모는 Docker Compose를 기준으로 구성되어 있습니다.

```powershell
copy .env.example .env
docker compose up --build
```

구성 서비스:

- `postgres`: PostgreSQL 16 + PGVector
- `backend`: Spring Boot API 서버
- `frontend`: Next.js standalone 서버

서비스 주소:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8080/api/health`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

## 환경 변수

| 변수 | 설명 |
| --- | --- |
| `IWAP_BACKEND_PORT` | 호스트에 노출할 backend 포트 |
| `IWAP_FRONTEND_PORT` | 호스트에 노출할 frontend 포트 |
| `IWAP_POSTGRES_PORT` | 호스트에 노출할 PostgreSQL 포트 |
| `IWAP_DATASOURCE_URL` | backend 컨테이너가 사용할 JDBC URL |
| `IWAP_DATASOURCE_USERNAME` | PostgreSQL 사용자 |
| `IWAP_DATASOURCE_PASSWORD` | PostgreSQL 비밀번호 |
| `NEXT_PUBLIC_IWAP_API_BASE_URL` | 브라우저에서 호출할 backend API URL |
| `NEXT_PUBLIC_IWAP_WS_URL` | 브라우저에서 연결할 workflow WebSocket URL |
| `IWAP_AI_PROVIDER` | `mock` 또는 실제 AI provider |
| `IWAP_INTEGRATION_MODE` | `mock` 또는 실제 tool adapter 모드 |
| `OPENAI_API_KEY` | OpenAI/Spring AI 연동 시 사용 |
| `SLACK_BOT_TOKEN` | Slack 실전 발송 연동 시 사용 |
| `SMTP_HOST` | Email 실전 발송 SMTP host |

## 운영 명령

상태 확인:

```powershell
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

서비스 종료:

```powershell
docker compose down
```

데이터까지 초기화:

```powershell
docker compose down -v
```

Frontend public env는 Next.js 빌드 시점에 브라우저 번들에 반영됩니다. API/WS URL을 바꾼 뒤에는 frontend 이미지를 다시 빌드해야 합니다.

```powershell
docker compose build frontend
docker compose up frontend
```

## 클라우드 배포 방향

포트폴리오와 PoC 단계에서는 Docker Compose 실행을 기본으로 두고, 실제 고객 환경에서는 다음 구성을 권장합니다.

- Backend: AWS ECS Fargate, Elastic Beanstalk, 또는 Kubernetes
- Frontend: Vercel, AWS Amplify, 또는 ECS/Nginx
- Database: AWS RDS PostgreSQL + PGVector
- Secrets: AWS Secrets Manager 또는 Parameter Store
- Logs: CloudWatch Logs
- Report artifacts: S3

## 운영 고려사항

- Mock Provider는 포트폴리오 데모 안정성을 위해 기본값으로 둡니다.
- Windows Docker Desktop 환경에서 이미지 아키텍처 차이를 줄이기 위해 compose 서비스는 `linux/amd64` platform을 명시합니다.
- 실제 외부 발송 Tool은 Human-in-the-Loop 승인 정책 뒤에서 실행해야 합니다.
- 모든 Tool Call, 승인 결정, Agent 이벤트는 Audit Log에 남기는 방향으로 확장합니다.
- AI provider 비용 관리를 위해 provider별 토큰 사용량 집계를 추후 확장 포인트로 둡니다.
- PostgreSQL persistence는 Flyway schema와 JPA store로 연결되어 있으며 workflow history, approvals, artifacts, audit logs를 재시작 후에도 복원합니다.
