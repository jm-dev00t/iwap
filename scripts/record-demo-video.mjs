import { chromium } from "playwright";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.env.IWAP_REPO_ROOT ?? process.cwd();
const outputDir = path.join(repoRoot, "docs", "assets", "demo");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: outputDir,
    size: { width: 1280, height: 720 },
  },
});

const page = await context.newPage();
page.setDefaultTimeout(15000);

async function sleep(ms) {
  await page.waitForTimeout(ms);
}

async function caption(title, subtitle = "") {
  await page.evaluate(
    ({ title, subtitle }) => {
      let overlay = document.querySelector("[data-demo-caption]");
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.setAttribute("data-demo-caption", "true");
        overlay.style.position = "fixed";
        overlay.style.left = "32px";
        overlay.style.bottom = "28px";
        overlay.style.zIndex = "999999";
        overlay.style.maxWidth = "720px";
        overlay.style.padding = "18px 22px";
        overlay.style.borderRadius = "10px";
        overlay.style.background = "rgba(23, 22, 20, 0.88)";
        overlay.style.border = "1px solid rgba(255, 255, 255, 0.14)";
        overlay.style.boxShadow = "0 16px 50px rgba(0, 0, 0, 0.28)";
        overlay.style.color = "#fff";
        overlay.style.fontFamily = "Arial, sans-serif";
        overlay.style.backdropFilter = "blur(8px)";
        document.body.appendChild(overlay);
      }
      overlay.innerHTML = `
        <div style="font-size: 13px; letter-spacing: 0.14em; color: #f2bd4b; font-weight: 700;">IWAP PORTFOLIO DEMO</div>
        <div style="margin-top: 8px; font-size: 25px; line-height: 1.25; font-weight: 800;">${title}</div>
        ${subtitle ? `<div style="margin-top: 7px; font-size: 15px; line-height: 1.5; color: #d6d2ca;">${subtitle}</div>` : ""}
      `;
    },
    { title, subtitle },
  );
}

async function safeClickByRole(role, name) {
  const locator = page.getByRole(role, { name });
  await locator.scrollIntoViewIfNeeded();
  await locator.click();
}

await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
await caption("자연어 명령을 업무 자동화 워크플로로 변환", "Spring Boot API, Next.js UI, PostgreSQL, JWT 인증, WebSocket 이벤트 기반 데모");
await sleep(5000);

await caption("월간 매출 보고서 자동화 실행", "사용자 명령을 계획, 실행, 검증, 보고, 알림 에이전트 단계로 처리합니다.");
await safeClickByRole("button", "워크플로 실행");
await page.getByText("월간 매출 보고서 자동화", { exact: false }).waitFor();
await sleep(5500);

await caption("승인이 필요한 재고 부족 시나리오 선택", "외부 발송이나 구매 영향이 있는 작업은 Human-in-the-loop 승인 단계로 보냅니다.");
await safeClickByRole("button", "재고 부족 알림 재고 부족 제품 리스트 뽑아서 구매팀 카카오톡으로 보내");
await sleep(2500);
await safeClickByRole("button", "워크플로 실행");
await page.locator("text=승인 대기").first().waitFor();
await sleep(5500);

await caption("워크플로 대시보드에서 실행 상태 확인", "도구 호출, 이벤트, 감사 로그가 실행 단위로 추적됩니다.");
await page.getByRole("link", { name: "워크플로" }).click();
await page.waitForURL("**/workflows");
await sleep(5500);

await caption("승인함에서 위험 작업을 사람이 통제", "승인/반려 API는 JWT 인증과 중복 처리 방어를 거칩니다.");
await page.getByRole("link", { name: "승인함" }).click();
await page.waitForURL("**/approvals");
await sleep(4000);
const approveButtons = page.getByRole("button", { name: "승인" });
if ((await approveButtons.count()) > 0) {
  await approveButtons.first().click();
  await sleep(4500);
}

await caption("실행 이력에서 완료/승인 대기 흐름 추적", "요청자, 상태, 실행 결과를 운영자가 빠르게 확인할 수 있습니다.");
await page.getByRole("link", { name: "이력" }).click();
await page.waitForURL("**/history");
await sleep(5000);

await caption("보고서와 운영 화면까지 연결된 포트폴리오 데모", "로컬 Docker Compose와 Render/Vercel 배포 구성을 함께 갖춘 end-to-end 프로젝트입니다.");
await page.getByRole("link", { name: "보고서" }).click();
await page.waitForURL("**/reports");
await sleep(4500);
await page.getByRole("link", { name: "설정" }).click();
await page.waitForURL("**/settings");
await sleep(4500);

await caption("IWAP: Intelligent Workflow Automation Platform", "이력서와 GitHub README에 넣기 좋은 실제 구동 화면 데모");
await page.getByRole("link", { name: "명령 센터" }).click();
await page.waitForURL("**/");
await sleep(5500);

const video = page.video();
await context.close();
await browser.close();

const videoPath = await video.path();
const files = await readdir(outputDir);
const newestWebm = (
  await Promise.all(
    files
      .filter((file) => file.endsWith(".webm"))
      .map(async (file) => {
        const fullPath = path.join(outputDir, file);
        return { fullPath, mtimeMs: (await stat(fullPath)).mtimeMs };
      }),
  )
).sort((a, b) => b.mtimeMs - a.mtimeMs)[0]?.fullPath ?? videoPath;

console.log(newestWebm);
