# 로컬 개발 환경 체크리스트

## 필수 도구

- Java 21
- Maven 3.9+
- Node.js 22
- Docker Desktop

## 설치 확인

```powershell
java -version
javac -version
mvn -version
node -v
npm -v
docker version
docker compose version
```

## Frontend 검증

```powershell
cd D:\work\iwap\frontend
npm install
npm run typecheck
npm run build
npm audit --audit-level=high
```

## Backend 검증

로컬 Java/Maven이 PATH에 있다면:

```powershell
cd D:\work\iwap\backend
mvn test
```

로컬 Java/Maven 없이 Docker Maven 이미지로 검증하려면:

```powershell
docker run --rm --platform linux/amd64 `
  -v D:/work/iwap/backend:/workspace `
  -w /workspace `
  maven:3.9.9-eclipse-temurin-21 mvn test
```

## 전체 Docker 실행

```powershell
cd D:\work\iwap
copy .env.example .env
docker compose config
docker compose up --build -d
docker compose ps
```

정상 상태:

- `iwap-postgres`: `healthy`
- `iwap-backend`: `healthy`
- `iwap-frontend`: `healthy`

브라우저 확인:

```text
http://localhost:3000
http://localhost:8080/swagger-ui.html
```

## Docker Desktop WSL 용량 관리

Docker Desktop의 WSL2 디스크는 기본적으로 C드라이브 아래에 생기며 이미지와 build cache가 쌓이면 빠르게 커집니다. 포트폴리오 작업 PC에서는 Docker Desktop `Settings > Resources > Advanced > Disk image location`을 D드라이브로 옮기는 것을 권장합니다.

권장 위치 예시:

```text
D:\DockerDesktop\wsl
```

이전 후 확인:

```powershell
Get-ChildItem "$env:LOCALAPPDATA\Docker\wsl" -Recurse -ErrorAction SilentlyContinue |
  Sort-Object Length -Descending |
  Select-Object -First 10 FullName, Length

Get-ChildItem "D:\DockerDesktop\wsl" -Recurse -ErrorAction SilentlyContinue |
  Sort-Object Length -Descending |
  Select-Object -First 10 FullName, Length
```

현재 정상 예시는 `docker_data.vhdx`가 `D:\DockerDesktop\wsl\DockerDesktopWSL\disk` 아래에 있는 상태입니다. Docker Desktop UI의 Apply가 조용히 실패하면 Docker Desktop을 종료한 뒤 관리자 PowerShell에서 `wsl --shutdown`을 실행하고 다시 적용합니다.

쌓인 build cache만 정리하려면:

```powershell
docker builder prune -a
```

안 쓰는 이미지까지 정리하려면:

```powershell
docker system prune -a
```

## Auth Smoke Test

```powershell
$manager = Invoke-RestMethod `
  -Uri http://localhost:8080/api/auth/demo-login `
  -Method Post `
  -Body '{"role":"MANAGER"}' `
  -ContentType 'application/json'

$headers = @{ Authorization = "Bearer $($manager.accessToken)" }

Invoke-RestMethod -Uri http://localhost:8080/api/tools -Headers $headers
```

비로그인 상태의 `/api/tools`는 `401`, `VIEWER`의 승인 API 호출은 `403`, `MANAGER`의 승인 API 호출은 성공해야 합니다.

## 문제 해결

로그 확인:

```powershell
docker compose logs -f postgres
docker compose logs -f backend
docker compose logs -f frontend
```

DB 초기화:

```powershell
docker compose down -v
```

포트 충돌 시 `.env`에서 다음 값을 바꿉니다.

```text
IWAP_BACKEND_PORT=8080
IWAP_FRONTEND_PORT=3000
IWAP_POSTGRES_PORT=5432
NEXT_PUBLIC_IWAP_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_IWAP_WS_URL=http://localhost:8080/ws/workflows
```

## 현재 상태

- Frontend typecheck/build/audit는 로컬에서 통과했습니다.
- Backend Maven Test는 Docker Maven 이미지와 GitHub Actions에서 통과했습니다.
- Docker Build는 GitHub Actions에서 통과했습니다.
- Docker Desktop 설치 후 로컬 `docker compose up --build -d` 검증이 통과했습니다.
- 로컬 compose 기준 Postgres, Backend, Frontend health check가 모두 `healthy` 상태입니다.
- `POST /api/workflows/runs` smoke test와 승인 권한 smoke test가 통과했습니다.
- STOMP/SockJS WebSocket smoke test에서 `/topic/workflows` 이벤트 수신을 확인했습니다.
- Backend 컨테이너 재시작 전후에 workflow history와 approval decision 상태가 유지되는 것을 확인했습니다.
- Docker Desktop WSL 디스크가 D드라이브의 `D:\DockerDesktop\wsl\DockerDesktopWSL\disk` 아래로 이전된 것을 확인했습니다.
