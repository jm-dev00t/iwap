// 데이터 소스 조회 결과 — application 계층 반환 타입
package com.iwap.application.datasource;

import java.util.List;

public record DataSourceResult(
        String type,
        String label,
        int rowCount,
        List<String> headers,
        List<List<String>> rows
) {
    public static DataSourceResult of(String type, String label, List<String> headers, List<List<String>> rows) {
        return new DataSourceResult(type, label, rows.size(), headers, rows);
    }
}
