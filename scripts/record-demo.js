// IWAP 데모 영상 자동 녹화 스크립트 (Playwright)
// 시나리오: 월간 매출 보고서 생성 → 이메일 발송 승인 → 승인함 처리 → 보고서 확인
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const VIDEO_DIR = path.join(__dirname, "../docs/assets/demo/tmp-video");
const OUTPUT_MP4 = path.join(__dirname, "../docs/assets/demo/iwap-demo.mp4");
const THUMB_PNG = path.join(__dirname, "../docs/assets/demo/iwap-demo-thumb.png");
const BASE_URL = "http://localhost:3000";
const API_URL = "http://localhost:8080";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function demoLogin(page) {
  const res = await page.request.post(`${API_URL}/api/auth/demo-login`);
  const session = await res.json();
  await page.evaluate((s) => {
    localStorage.setItem("iwap.demoAuthSession", JSON.stringify(s));
  }, session);
}

(async () => {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    channel: "msedge",
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
    colorScheme: "light",
  });

  const page = await context.newPage();

  // ── 1. 홈 (명령 센터) ──────────────────────────────────────────────────────
  console.log("1. 홈 로드...");
  await page.goto(BASE_URL);
  await demoLogin(page);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await sleep(2500);

  // ── 2. 명령 입력 ───────────────────────────────────────────────────────────
  console.log("2. 명령 입력...");
  const textarea = await page.waitForSelector('textarea[aria-label="AI 업무 채팅 입력"]');
  await textarea.click();
  await sleep(600);
  await page.keyboard.type("이번 달 매출 보고서 만들어서 manager@demo-company.com으로 보내줘", { delay: 60 });
  await sleep(1200);
  await page.keyboard.press("Enter");

  // ── 3. AI 플랜 생성 대기 ───────────────────────────────────────────────────
  console.log("3. AI 플랜 대기 (최대 45초)...");
  await page.waitForSelector('button[aria-label*="승인하고 실행"]', { timeout: 45000 });
  await sleep(800);

  // 플랜 카드가 보이도록 스크롤
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: "smooth" }));
  await sleep(2500);

  // ── 4. 승인하고 실행 ────────────────────────────────────────────────────────
  console.log("4. 실행 버튼 클릭...");
  await page.click('button[aria-label*="승인하고 실행"]');
  await sleep(4000);

  // 채팅 영역으로 스크롤
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await sleep(2000);

  // ── 5. 승인함 이동 ─────────────────────────────────────────────────────────
  console.log("5. 승인함 이동...");
  await page.goto(`${BASE_URL}/approvals`);
  await page.waitForLoadState("networkidle");
  await sleep(2000);

  // 승인 카드 대기
  const approveBtn = await page.waitForSelector('button[aria-label*="승인"]', { timeout: 15000 });
  await sleep(2500);

  // ── 6. 승인 클릭 ───────────────────────────────────────────────────────────
  console.log("6. 승인 처리...");
  await approveBtn.click();
  await sleep(3500);

  // ── 7. 보고서 페이지 ────────────────────────────────────────────────────────
  console.log("7. 보고서 페이지 이동...");
  await page.goto(`${BASE_URL}/reports`);
  await page.waitForLoadState("networkidle");
  await sleep(1500);

  // 첫 번째 보고서 카드 클릭 (있는 경우)
  const reportCard = await page.$('a[href*="/reports"]') ?? await page.$('[role="article"]');
  if (reportCard) {
    await reportCard.click();
    await sleep(1000);
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: "smooth" }));
    await sleep(2500);
  } else {
    await sleep(3000);
  }

  // ── 8. 마무리 ──────────────────────────────────────────────────────────────
  await sleep(1500);
  console.log("8. 녹화 종료...");

  // 썸네일 캡처 (보고서 페이지 상태에서)
  await page.screenshot({ path: THUMB_PNG, type: "png" });

  await context.close();
  await browser.close();

  // ── WebM → MP4 변환 ────────────────────────────────────────────────────────
  const webmFiles = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith(".webm"));
  if (webmFiles.length === 0) {
    console.error("녹화 파일을 찾을 수 없습니다.");
    process.exit(1);
  }
  const webmPath = path.join(VIDEO_DIR, webmFiles[0]);
  console.log(`변환 중: ${webmPath} → ${OUTPUT_MP4}`);

  execSync(
    `ffmpeg -y -i "${webmPath}" -c:v libx264 -preset fast -crf 22 -c:a aac -movflags +faststart "${OUTPUT_MP4}"`,
    { stdio: "inherit" }
  );

  // 임시 디렉토리 정리
  fs.rmSync(VIDEO_DIR, { recursive: true, force: true });

  console.log(`✅ 완료: ${OUTPUT_MP4}`);
  console.log(`✅ 썸네일: ${THUMB_PNG}`);
})();
