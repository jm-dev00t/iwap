package com.iwap.application.agent;

// 워크플로 결과를 시나리오별 한국어 보고서로 생성하는 에이전트
import com.iwap.application.workflow.WorkflowContext;
import com.iwap.application.workflow.WorkflowEventRecorder;
import com.iwap.domain.agent.AgentType;
import com.iwap.domain.report.ReportArtifact;
import com.iwap.domain.workflow.WorkflowEventType;
import org.springframework.stereotype.Component;

@Component
public class ReporterAgent implements WorkflowAgent {

    private final WorkflowEventRecorder recorder;

    public ReporterAgent(WorkflowEventRecorder recorder) {
        this.recorder = recorder;
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
            case MONTHLY_SALES_REPORT -> "2026년 5월 총매출 143,300,000원, 전월 대비 +9.3%. Slack/Email 공유 완료.";
            case WEEKLY_SALES_REPORT -> "주간 영업 활동 분석 완료. 계약 성사 7건, 신규 리드 23건.";
            case CUSTOMER_ONBOARDING -> "신규 고객 온보딩 완료. CRM 등록, 환영 이메일, 담당자 알림 처리.";
            case LOW_INVENTORY_ALERT -> "재고 부족 품목 3건 확인. 구매팀 알림 발송 완료.";
        };
    }

    private String buildContent(WorkflowContext context) {
        return switch (context.plan().scenario()) {
            case MONTHLY_SALES_REPORT -> """
                    # 2026년 5월 월간 매출 보고서

                    ## 핵심 지표

                    | 지표 | 2026년 5월 | 전월 | 변화 |
                    |------|---:|---:|---:|
                    | 총매출 | 143,300,000원 | 131,000,000원 | +9.3% |
                    | 총주문 | 189건 | 177건 | +6.8% |
                    | 평균 매출총이익률 | 34.2% | 33.3% | +0.9%p |

                    ## 채널별 매출

                    | 채널 | 매출 | 주문 | 총이익률 |
                    |------|---:|---:|---:|
                    | B2B Direct | 84,200,000원 | 42건 | 38% |
                    | Online Store | 31,500,000원 | 128건 | 31% |
                    | Partner Reseller | 27,600,000원 | 19건 | 27% |

                    ## 발송 내역
                    - Slack #sales-report 채널 공유 완료
                    - 담당자 이메일 발송 완료
                    """;
            case WEEKLY_SALES_REPORT -> """
                    # 주간 영업 실적 보고서

                    ## 이번 주 성과

                    | 항목 | 건수 |
                    |------|---:|
                    | 계약 성사 | 7건 |
                    | 신규 리드 | 23건 |
                    | 미팅 | 18건 |

                    영업 리포트가 생성되어 PDF로 저장되었습니다.
                    """;
            case CUSTOMER_ONBOARDING -> """
                    # 신규 고객 온보딩 완료 보고서

                    ## 처리 내역
                    - CRM 시스템 고객 등록 완료
                    - 환영 이메일 발송 완료
                    - 담당 영업 담당자 Slack 알림 완료

                    온보딩 프로세스가 성공적으로 완료되었습니다.
                    """;
            case LOW_INVENTORY_ALERT -> """
                    # 재고 부족 알림 보고서

                    ## 부족 품목

                    | SKU | 품목명 | 현재 재고 | 최소 재고 |
                    |-----|--------|---:|---:|
                    | SKU-001 | 제품 A | 5개 | 20개 |
                    | SKU-007 | 제품 B | 2개 | 15개 |
                    | SKU-013 | 제품 C | 8개 | 25개 |

                    구매팀 알림 발송이 완료되었습니다.
                    """;
        };
    }
}
