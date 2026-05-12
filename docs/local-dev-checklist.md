# 로컬 개발 환경 체크리스트

현재 작업 PC에서 프론트엔드는 검증되었지만, 백엔드와 Docker 검증을 위해 아래 도구가 PATH에 잡혀 있어야 합니다.

## 필수 설치

- Java 21
- Maven 3.9+
- Docker Desktop
- Node.js 22

## 설치 확인

```powershell
java -version
javac -version
mvn -version
docker version
node -v
npm -v
```

## 백엔드 검증

```powershell
cd D:\work\iwap\backend
mvn test
```

## 프론트엔드 검증

```powershell
cd D:\work\iwap\frontend
npm install
npm run typecheck
npm run build
npm start
```

## 전체 실행

```powershell
cd D:\work\iwap
copy .env.example .env
docker compose up --build
```

## Docker verification checklist

Run these after Docker Desktop or a compatible Docker CLI is installed and available in PATH:

```powershell
cd D:\work\iwap
docker compose config
docker compose up --build
```

In a second terminal:

```powershell
docker compose ps
curl http://localhost:8080/api/health
```

Open the frontend:

```text
http://localhost:3000
```

Useful diagnostics:

```powershell
docker compose logs -f postgres
docker compose logs -f backend
docker compose logs -f frontend
```

Reset local database state:

```powershell
docker compose down -v
```

## 현재 확인된 제한

이 작업 환경에서는 `java`, `javac`, `mvn`, `docker` 명령이 PATH에서 발견되지 않아 백엔드 컴파일과 Docker Compose 검증을 실행하지 못했습니다. 프론트엔드는 `npm run typecheck`, `npm run build`, 브라우저 라우트 검증까지 완료했습니다.
