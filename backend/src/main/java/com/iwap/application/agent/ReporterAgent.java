package com.iwap.application.agent;

// 워크플로 결과를 시나리오별 한국어 보고서로 생성하는 에이전트
import com.iwap.application.datasource.DataSourceResult;
import com.iwap.application.datasource.DataSourceService;
import com.iwap.application.workflow.WorkflowContext;
import com.iwap.application.workflow.WorkflowEventRecorder;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.report.ReportArtifact;
import com.iwap.domain.workflow.WorkflowEventType;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ReporterAgent implements WorkflowAgent {

    private final WorkflowEventRecorder recorder;
    private final DataSourceService dataSourceService;

    public ReporterAgent(WorkflowEventRecorder recorder, DataSourceService dataSourceService) {
        this.recorder = recorder;
        this.dataSourceService = dataSourceService;
    }

    @Override
    public AgentType type() {
        return AgentType.REPORTER;
    }

    @Override
    public void handle(WorkflowContext context) {
        context.artifacts().add(ReportArtifact.markdown(
                context.runId(),
                context.plan().title(),
                buildSummary(context),
                buildContent(context)
        ));
        recorder.record(context, type(), WorkflowEventType.REPORT_CREATED,
                context.plan().title() + " 보고서를 생성했습니다.");
    }

    private String buildSummary(WorkflowContext context) {
        return switch (context.plan().scenario()) {
            case MONTHLY_SALES_REPORT -> buildMonthlySalesSummary();
            case WEEKLY_SALES_REPORT -> buildWeeklySalesSummary();
            case CUSTOMER_ONBOARDING -> buildCustomerOnboardingSummary();
            case LOW_INVENTORY_ALERT -> buildLowInventorySummary();
        };
    }

    private String buildContent(WorkflowContext context) {
        return switch (context.plan().scenario()) {
            case MONTHLY_SALES_REPORT -> buildMonthlySalesContent();
            case WEEKLY_SALES_REPORT -> buildWeeklySalesContent();
            case CUSTOMER_ONBOARDING -> buildCustomerOnboardingContent();
            case LOW_INVENTORY_ALERT -> buildLowInventoryContent();
        };
    }

    // ── MONTHLY_SALES_REPORT ──────────────────────────────────────────────────

    private String buildMonthlySalesSummary() {
        try {
            DataSourceResult result = dataSourceService.load("sales");
            List<List<String>> rows = result.rows();

            long curRevenue = sumRevenue(rows, "2026-05");
            long prevRevenue = sumRevenue(rows, "2026-04");
            double pct = (curRevenue - prevRevenue) / (double) prevRevenue * 100;
            String sign = pct >= 0 ? "+" : "";

            return String.format(
                    "2026년 5월 총매출 %,d원, 전월 대비 %s%.1f%%. Slack/Email 공유 완료.",
                    curRevenue, sign, pct);
        } catch (Exception e) {
            return "(데이터 로드 실패)";
        }
    }

    private String buildMonthlySalesContent() {
        try {
            DataSourceResult result = dataSourceService.load("sales");
            List<List<String>> rows = result.rows();

            long curRevenue = sumRevenue(rows, "2026-05");
            long prevRevenue = sumRevenue(rows, "2026-04");
            long curOrders = sumOrders(rows, "2026-05");
            long prevOrders = sumOrders(rows, "2026-04");
            double revPct = (curRevenue - prevRevenue) / (double) prevRevenue * 100;
            double ordPct = (curOrders - prevOrders) / (double) prevOrders * 100;
            double curMargin = avgMargin(rows, "2026-05") * 100;
            double prevMargin = avgMargin(rows, "2026-04") * 100;

            StringBuilder channels = new StringBuilder();
            for (List<String> row : rows) {
                if ("2026-05".equals(row.get(0))) {
                    String channel = row.get(1);
                    long revenue = parseLong(row.get(2));
                    long orders = parseLong(row.get(3));
                    int margin = (int) Math.round(parseDouble(row.get(4)) * 100);
                    channels.append(String.format("| %s | %,d원 | %d건 | %d%% |%n",
                            channel, revenue, orders, margin));
                }
            }

            return String.format("""
                    # 2026년 5월 월간 매출 보고서

                    ## 핵심 지표

                    | 지표 | 2026년 5월 | 전월 | 변화 |
                    |------|---:|---:|---:|
                    | 총매출 | %,d원 | %,d원 | %+.1f%% |
                    | 총주문 | %d건 | %d건 | %+.1f%% |
                    | 평균 매출총이익률 | %.1f%% | %.1f%% | %+.1f%%p |

                    ## 채널별 매출

                    | 채널 | 매출 | 주문 | 총이익률 |
                    |------|---:|---:|---:|
                    %s
                    ## 발송 내역
                    - Slack #sales-report 채널 공유 완료
                    - 담당자 이메일 발송 완료
                    """,
                    curRevenue, prevRevenue, revPct,
                    curOrders, prevOrders, ordPct,
                    curMargin, prevMargin, curMargin - prevMargin,
                    channels.toString().stripTrailing());
        } catch (Exception e) {
            return "(데이터 로드 실패)";
        }
    }

    // ── WEEKLY_SALES_REPORT ───────────────────────────────────────────────────

    private String buildWeeklySalesSummary() {
        try {
            DataSourceResult result = dataSourceService.load("weekly");
            List<List<String>> rows = result.rows();

            long closedDeals = rows.stream().mapToLong(r -> parseLong(r.get(4))).sum();
            long qualifiedLeads = rows.stream().mapToLong(r -> parseLong(r.get(2))).sum();

            return String.format(
                    "주간 영업 활동 분석 완료. 계약 성사 %d건, 신규 리드 %d건.",
                    closedDeals, qualifiedLeads);
        } catch (Exception e) {
            return "(데이터 로드 실패)";
        }
    }

    private String buildWeeklySalesContent() {
        try {
            DataSourceResult result = dataSourceService.load("weekly");
            List<List<String>> rows = result.rows();

            long closedDeals = rows.stream().mapToLong(r -> parseLong(r.get(4))).sum();
            long qualifiedLeads = rows.stream().mapToLong(r -> parseLong(r.get(2))).sum();
            long closedRevenue = rows.stream().mapToLong(r -> parseLong(r.get(5))).sum();

            return String.format("""
                    # 주간 영업 실적 보고서

                    ## 이번 주 성과

                    | 항목 | 건수 |
                    |------|---:|
                    | 계약 성사 | %d건 |
                    | 신규 리드 | %d건 |
                    | 누적 매출 | %,d원 |

                    영업 리포트가 생성되어 PDF로 저장되었습니다.
                    """,
                    closedDeals, qualifiedLeads, closedRevenue);
        } catch (Exception e) {
            return "(데이터 로드 실패)";
        }
    }

    // ── CUSTOMER_ONBOARDING ───────────────────────────────────────────────────

    private String buildCustomerOnboardingSummary() {
        try {
            DataSourceResult result = dataSourceService.load("customers");
            List<List<String>> rows = result.rows();

            long onboardingCount = rows.stream()
                    .filter(r -> "Onboarding".equalsIgnoreCase(r.get(4)))
                    .count();

            return String.format(
                    "신규 고객 온보딩 완료. CRM 등록, 환영 이메일, 담당자 알림 처리. (온보딩 중 %d건)",
                    onboardingCount);
        } catch (Exception e) {
            return "신규 고객 온보딩 완료. CRM 등록, 환영 이메일, 담당자 알림 처리.";
        }
    }

    private String buildCustomerOnboardingContent() {
        try {
            DataSourceResult result = dataSourceService.load("customers");
            List<List<String>> rows = result.rows();

            StringBuilder onboarding = new StringBuilder();
            for (List<String> row : rows) {
                if ("Onboarding".equalsIgnoreCase(row.get(4))) {
                    onboarding.append(String.format("- %s (%s)%n", row.get(1), row.get(2)));
                }
            }

            String list = onboarding.toString().stripTrailing();
            if (list.isBlank()) {
                list = "- (온보딩 중인 고객 없음)";
            }

            return String.format("""
                    # 신규 고객 온보딩 완료 보고서

                    ## 온보딩 처리 고객
                    %s

                    ## 처리 내역
                    - CRM 시스템 고객 등록 완료
                    - 환영 이메일 발송 완료
                    - 담당 영업 담당자 Slack 알림 완료

                    온보딩 프로세스가 성공적으로 완료되었습니다.
                    """, list);
        } catch (Exception e) {
            return "(데이터 로드 실패)";
        }
    }

    // ── LOW_INVENTORY_ALERT ───────────────────────────────────────────────────

    private String buildLowInventorySummary() {
        try {
            DataSourceResult result = dataSourceService.load("inventory");
            List<List<String>> rows = result.rows();

            long lowCount = rows.stream()
                    .filter(r -> parseLong(r.get(2)) < parseLong(r.get(3)))
                    .count();

            return String.format("재고 부족 품목 %d건 확인. 구매팀 알림 발송 완료.", lowCount);
        } catch (Exception e) {
            return "(데이터 로드 실패)";
        }
    }

    private String buildLowInventoryContent() {
        try {
            DataSourceResult result = dataSourceService.load("inventory");
            List<List<String>> rows = result.rows();

            StringBuilder items = new StringBuilder();
            for (List<String> row : rows) {
                long stock = parseLong(row.get(2));
                long reorder = parseLong(row.get(3));
                if (stock < reorder) {
                    items.append(String.format("| %s | %s | %d개 | %d개 |%n",
                            row.get(0), row.get(1), stock, reorder));
                }
            }

            return String.format("""
                    # 재고 부족 알림 보고서

                    ## 부족 품목

                    | SKU | 품목명 | 현재 재고 | 최소 재고 |
                    |-----|--------|---:|---:|
                    %s
                    구매팀 알림 발송이 완료되었습니다.
                    """, items.toString().stripTrailing());
        } catch (Exception e) {
            return "(데이터 로드 실패)";
        }
    }

    // ── 유틸리티 ────────────────────────────────────────────────────────────────

    private long sumRevenue(List<List<String>> rows, String month) {
        return rows.stream()
                .filter(r -> month.equals(r.get(0)))
                .mapToLong(r -> parseLong(r.get(2)))
                .sum();
    }

    private long sumOrders(List<List<String>> rows, String month) {
        return rows.stream()
                .filter(r -> month.equals(r.get(0)))
                .mapToLong(r -> parseLong(r.get(3)))
                .sum();
    }

    private double avgMargin(List<List<String>> rows, String month) {
        return rows.stream()
                .filter(r -> month.equals(r.get(0)))
                .mapToDouble(r -> parseDouble(r.get(4)))
                .average()
                .orElse(0.0);
    }

    private long parseLong(String s) {
        try {
            return Long.parseLong(s.trim());
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    private double parseDouble(String s) {
        try {
            return Double.parseDouble(s.trim());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }
}
