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

```powershell
cd D:\work\iwap\backend
mvn test
```

현재 로컬 PC에서는 Java, Maven이 PATH에 없어 backend 로컬 컴파일은 GitHub Actions에서 검증했습니다.

## 전체 Docker 실행

Docker Desktop 설치 후:

```powershell
cd D:\work\iwap
copy .env.example .env
docker compose config
docker compose up --build
```

다른 터미널에서:

```powershell
docker compose ps
curl http://localhost:8080/api/health
```

브라우저 확인:

```text
http://localhost:3000
http://localhost:8080/swagger-ui.html
```

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
IWAP_BACKEND_PORT=8081
IWAP_FRONTEND_PORT=3001
IWAP_POSTGRES_PORT=5433
NEXT_PUBLIC_IWAP_API_BASE_URL=http://localhost:8081
NEXT_PUBLIC_IWAP_WS_URL=ws://localhost:8081/ws/workflows
```

## 현재 상태

- Frontend typecheck/build/audit는 로컬에서 통과했습니다.
- Backend Maven Test와 Docker Build는 GitHub Actions에서 통과했습니다.
- Docker Desktop은 관리자 권한 승인 설치가 필요해 로컬 compose 실행 검증은 설치 후 진행해야 합니다.
