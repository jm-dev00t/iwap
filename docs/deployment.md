# 배포 및 운영 가이드

## 로컬 Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

구성:

- `postgres`: PostgreSQL 16 + PGVector
- `backend`: Spring Boot API 서버
- `frontend`: Next.js standalone 서버

## 환경 변수

| 변수 | 설명 |
| --- | --- |
| `IWAP_AI_PROVIDER` | `mock` 또는 실제 AI Provider 선택 |
| `IWAP_INTEGRATION_MODE` | `mock` 또는 실제 Tool Adapter 모드 |
| `OPENAI_API_KEY` | OpenAI/Spring AI 연동 키 |
| `SLACK_BOT_TOKEN` | Slack 실제 발송 연동 키 |
| `SMTP_HOST` | Email 실제 발송 SMTP 호스트 |

## 클라우드 배포 방향

포트폴리오에서는 Docker Compose 실행을 기본으로 두고, 실제 고객 PoC에서는 다음 구성을 권장합니다.

- Backend: AWS ECS Fargate 또는 Elastic Beanstalk
- Frontend: Vercel, AWS Amplify, 또는 ECS/Nginx
- Database: AWS RDS PostgreSQL + PGVector
- Secrets: AWS Secrets Manager
- Logs: CloudWatch Logs
- File artifacts: S3

## Docker local operations

Start the full local demo:

```powershell
copy .env.example .env
docker compose up --build
```

Check service state:

```powershell
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

Expected local URLs:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:8080/api/health`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

Stop services while keeping database data:

```powershell
docker compose down
```

Reset services and delete the local PostgreSQL volume:

```powershell
docker compose down -v
```

The frontend Docker image receives `NEXT_PUBLIC_IWAP_API_BASE_URL` and `NEXT_PUBLIC_IWAP_WS_URL` as build arguments. Rebuild the frontend image after changing either value:

```powershell
docker compose build frontend
docker compose up frontend
```

## 운영 고려사항

- Mock Provider는 데모 안정성을 위해 기본값으로 둡니다.
- 실제 외부 발송 Tool은 승인 정책을 거친 뒤 실행해야 합니다.
- 모든 Tool Call과 승인 결정은 Audit Log에 저장합니다.
- AI 비용 관리를 위해 Provider별 토큰 사용량 집계를 추후 확장 포인트로 둡니다.
