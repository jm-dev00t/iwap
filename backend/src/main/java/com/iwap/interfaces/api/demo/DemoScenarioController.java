package com.iwap.interfaces.api.demo;

import com.iwap.application.workflow.WorkflowOrchestrator;
import com.iwap.domain.workflow.WorkflowRun;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/demo-scenarios")
public class DemoScenarioController {

    private final WorkflowOrchestrator orchestrator;

    public DemoScenarioController(WorkflowOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    @GetMapping
    public List<DemoScenarioResponse> scenarios() {
        return List.of(
                new DemoScenarioResponse(
                        "monthly-sales-report",
                        "Monthly Sales Report Automation",
                        "이번 달 매출 보고서 만들어서 슬랙 채널과 이메일로 보내줘",
                        "월말 보고서 작성과 공유 시간을 줄이고, 경영진 보고 흐름을 표준화합니다."
                ),
                new DemoScenarioResponse(
                        "customer-onboarding",
                        "New Customer Onboarding",
                        "신규 고객 등록 후 환영 이메일 보내고, CRM에 기록하고, 담당자에게 알림",
                        "영업 전환 이후 고객 등록, 환영 메일, 담당자 알림 누락을 방지합니다."
                ),
                new DemoScenarioResponse(
                        "low-inventory",
                        "Low Inventory Purchasing Alert",
                        "재고 부족 제품 리스트 뽑아서 구매팀 카카오톡으로 보내",
                        "재고 부족 상황을 구매팀에 빠르게 전달하되, 구매 영향이 있는 작업은 승인으로 통제합니다."
                ),
                new DemoScenarioResponse(
                        "weekly-sales-report",
                        "Weekly Sales Performance Report",
                        "주간 영업 실적 분석해서 PDF 리포트 생성 후 공유",
                        "반복되는 주간 영업 회고와 실적 공유를 자동화합니다."
                )
        );
    }

    @PostMapping("/seed")
    public List<WorkflowRun> seedDemoRuns() {
        return scenarios().stream()
                .map(scenario -> orchestrator.start(scenario.command(), "manager@demo-company.com"))
                .toList();
    }
}
