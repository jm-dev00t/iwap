import { CheckCircle2, Clock3, FileText, Mail, MessageSquare, ShieldCheck } from "lucide-react";

export type AgentName = string;

export type TimelineEvent = {
  agent: AgentName;
  status: "completed" | "running" | "waiting";
  title: string;
  detail: string;
  time: string;
};

export const demoScenarios = [
  {
    key: "monthly-sales-report",
    label: "월간 매출 보고서",
    command: "이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘",
    icon: FileText,
  },
  {
    key: "customer-onboarding",
    label: "신규 고객 온보딩",
    command: "신규 고객 등록 후 환영 이메일 보내고, 고객 관리 시스템에 기록하고, 담당자에게 알림",
    icon: Mail,
  },
  {
    key: "low-inventory",
    label: "재고 부족 알림",
    command: "재고 부족 제품 리스트 뽑아서 구매팀 카카오톡으로 보내",
    icon: ShieldCheck,
  },
  {
    key: "weekly-sales-report",
    label: "주간 영업 리포트",
    command: "주간 영업 실적 분석해서 PDF 리포트 생성 후 공유",
    icon: MessageSquare,
  },
];

export const timelineEvents: TimelineEvent[] = [
  {
    agent: "계획 에이전트",
    status: "completed",
    title: "업무 의도 구조화",
    detail: "월간 매출, 리포트 생성, 슬랙/이메일 발송 목표를 실행 계획으로 변환했습니다.",
    time: "09:41:08",
  },
  {
    agent: "실행 에이전트",
    status: "running",
    title: "도구 호출 실행",
    detail: "매출 데이터, 보고서 생성기, 슬랙, 이메일 어댑터를 순차 실행 중입니다.",
    time: "09:41:11",
  },
  {
    agent: "검증 에이전트",
    status: "waiting",
    title: "결과 검증 대기",
    detail: "필수 지표, 수신 대상, 생성 산출물 누락 여부를 확인할 예정입니다.",
    time: "대기",
  },
  {
    agent: "보고 에이전트",
    status: "waiting",
    title: "경영진 요약 생성",
    detail: "매출 증감, 채널별 기여도, 다음 액션을 리포트로 정리합니다.",
    time: "대기",
  },
  {
    agent: "알림 에이전트",
    status: "waiting",
    title: "완료 알림",
    detail: "요청자에게 작업 이력과 최종 결과를 공유합니다.",
    time: "대기",
  },
];

export const statusIcon = {
  completed: CheckCircle2,
  running: Clock3,
  waiting: Clock3,
};
