// CSV 샘플 파일을 읽어 데이터 소스 목록과 내용을 반환하는 서비스
package com.iwap.application.datasource;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DataSourceService {

    private static final Map<String, String> SOURCE_LABELS = new LinkedHashMap<>(Map.of(
            "sales", "월간 매출 데이터",
            "inventory", "재고 현황",
            "customers", "고객 데이터",
            "weekly", "주간 영업 활동"
    ));

    private static final Map<String, String> SOURCE_FILES = Map.of(
            "sales", "samples/sales-data.csv",
            "inventory", "samples/inventory.csv",
            "customers", "samples/customers.csv",
            "weekly", "samples/weekly-sales-activities.csv"
    );

    public List<DataSourceResult> availableSources() {
        return SOURCE_LABELS.keySet().stream()
                .map(type -> {
                    try {
                        return load(type);
                    } catch (Exception e) {
                        return DataSourceResult.of(type, SOURCE_LABELS.get(type), List.of(), List.of());
                    }
                })
                .collect(Collectors.toList());
    }

    public DataSourceResult load(String type) {
        String filename = SOURCE_FILES.get(type);
        if (filename == null) {
            throw new IllegalArgumentException("Unknown data source type: " + type);
        }
        try {
            ClassPathResource resource = new ClassPathResource(filename);
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                List<String> lines = reader.lines().filter(l -> !l.isBlank()).collect(Collectors.toList());
                if (lines.isEmpty()) {
                    return DataSourceResult.of(type, SOURCE_LABELS.get(type), List.of(), List.of());
                }
                List<String> headers = Arrays.asList(lines.get(0).split(","));
                List<List<String>> rows = lines.stream()
                        .skip(1)
                        .map(line -> Arrays.asList(line.split(",")))
                        .collect(Collectors.toList());
                return DataSourceResult.of(type, SOURCE_LABELS.get(type), headers, rows);
            }
        } catch (Exception e) {
            throw new IllegalStateException("Failed to read data source: " + type, e);
        }
    }
}
