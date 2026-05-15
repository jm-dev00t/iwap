package com.iwap.application.assistant;

import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

@Component
public class MockAssistantPlanner implements AssistantPlanner {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("[^\\s@]+@[^\\s@]+\\.[^\\s@]+");

    @Override
    public AssistantPlan plan(String command, AssistantSession session) {
        String normalized = command.toLowerCase(Locale.ROOT);
        String email = extractEmail(command);
        boolean mentionsEmail = normalized.contains("메일") || normalized.contains("email") || normalized.contains("이메일");

        if (mentionsEmail && email == null) {
            return new AssistantPlan(
                    "",
                    session.id(),
                    "missing-recipient-email",
                    0.92,
                    "이메일 발송을 하려면 받을 이메일 주소가 필요합니다.",
                    List.of("recipientEmail"),
                    List.of(),
                    false,
                    "",
                    scenarioKey(normalized),
                    command,
                    "manager@demo-company.com",
                    Map.of(),
                    "mock",
                    OffsetDateTime.now()
            );
        }

        String scenarioKey = scenarioKey(normalized);
        List<AssistantPlanAction> actions = actionsFor(scenarioKey, mentionsEmail || email != null);
        boolean requiresApproval = actions.stream().anyMatch(AssistantPlanAction::external);
        String requestedBy = email == null ? "manager@demo-company.com" : email;

        return new AssistantPlan(
                "",
                session.id(),
                scenarioKey,
                0.88,
                summaryFor(scenarioKey, actions),
                List.of(),
                actions,
                requiresApproval,
                requiresApproval ? "이메일, 슬랙, 카카오워크처럼 외부로 나가는 작업은 실행 전 확인이 필요합니다." : "",
                scenarioKey,
                command,
                requestedBy,
                email == null ? Map.of() : Map.of("recipientEmail", email),
                "mock",
                OffsetDateTime.now()
        );
    }

    private String extractEmail(String value) {
        var matcher = EMAIL_PATTERN.matcher(value);
        return matcher.find() ? matcher.group() : null;
    }

    private String scenarioKey(String normalizedCommand) {
        if (normalizedCommand.contains("재고") || normalizedCommand.contains("inventory") || normalizedCommand.contains("구매")) {
            return "low-inventory";
        }
        if (normalizedCommand.contains("신규 고객") || normalizedCommand.contains("온보딩") || normalizedCommand.contains("customer") || normalizedCommand.contains("crm")) {
            return "customer-onboarding";
        }
        if (normalizedCommand.contains("주간")
                || normalizedCommand.contains("이번 주")
                || normalizedCommand.contains("이번주")
                || normalizedCommand.contains("영업실적")
                || normalizedCommand.contains("영업 실적")
                || normalizedCommand.contains("weekly")) {
            return "weekly-sales-report";
        }
        if (normalizedCommand.contains("매출")
                || normalizedCommand.contains("보고서")
                || normalizedCommand.contains("리포트")
                || normalizedCommand.contains("report")
                || normalizedCommand.contains("월간")
                || normalizedCommand.contains("monthly")
                || normalizedCommand.contains("실적")
                || normalizedCommand.contains("메일")
                || normalizedCommand.contains("email")
                || normalizedCommand.contains("이메일")) {
            return "monthly-sales-report";
        }
        return "unsupported";
    }

    private List<AssistantPlanAction> actionsFor(String scenarioKey, boolean includeEmail) {
        return switch (scenarioKey) {
            case "low-inventory" -> List.of(
                    new AssistantPlanAction(1, "inventory", "재고 부족 품목 확인", "현재 재고와 재주문 기준을 비교합니다.", false),
                    new AssistantPlanAction(2, "approval", "구매팀 알림 승인 요청", "구매 활동으로 이어질 수 있어 실행 전 승인 대기 상태로 둡니다.", true),
                    new AssistantPlanAction(3, "kakao", "구매팀 알림 발송", "승인 후 구매팀 채널에 재고 부족 알림을 보냅니다.", true)
            );
            case "customer-onboarding" -> List.of(
                    new AssistantPlanAction(1, "crm", "CRM 고객 등록", "신규 고객 정보를 CRM에 기록합니다.", false),
                    new AssistantPlanAction(2, "email", "환영 이메일 발송", "고객에게 온보딩 안내 메일을 발송합니다.", true),
                    new AssistantPlanAction(3, "slack", "담당자 알림", "계정 담당자에게 후속 액션을 알립니다.", true)
            );
            case "weekly-sales-report" -> List.of(
                    new AssistantPlanAction(1, "sales-data", "주간 영업 자료 조회", "리드, 미팅, 파이프라인 데이터를 조회합니다.", false),
                    new AssistantPlanAction(2, "report-generator", "주간 리포트 생성", "Top Account와 다음 액션이 포함된 PDF 리포트를 만듭니다.", false),
                    new AssistantPlanAction(3, "email", "영업 리더 공유", "생성된 리포트를 이메일로 공유합니다.", true)
            );
            default -> includeEmail
                    ? List.of(
                            new AssistantPlanAction(1, "sales-data", "월간 매출 데이터 조회", "채널별 매출, 주문 수, 마진 데이터를 조회합니다.", false),
                            new AssistantPlanAction(2, "report-generator", "월간 매출 보고서 생성", "차트와 요약 액션이 포함된 보고서를 만듭니다.", false),
                            new AssistantPlanAction(3, "email", "보고서 이메일 발송", "승인 후 지정된 수신자에게 보고서를 발송합니다.", true)
                    )
                    : List.of(
                            new AssistantPlanAction(1, "sales-data", "월간 매출 데이터 조회", "채널별 매출, 주문 수, 마진 데이터를 조회합니다.", false),
                            new AssistantPlanAction(2, "report-generator", "월간 매출 보고서 생성", "차트와 요약 액션이 포함된 보고서를 만듭니다.", false)
                    );
        };
    }

    private String summaryFor(String scenarioKey, List<AssistantPlanAction> actions) {
        return switch (scenarioKey) {
            case "low-inventory" -> "재고 부족 품목을 확인하고 구매팀 알림 전 승인을 요청합니다.";
            case "customer-onboarding" -> "신규 고객 온보딩을 위해 CRM 등록, 환영 메일, 담당자 알림을 처리합니다.";
            case "weekly-sales-report" -> "주간 영업실적 리포트를 생성하고 영업 리더에게 공유합니다.";
            default -> actions.stream().anyMatch(action -> action.toolName().equals("email"))
                    ? "월간 매출 보고서를 생성하고 승인 후 이메일로 발송합니다."
                    : "월간 매출 보고서를 생성합니다.";
        };
    }
}
