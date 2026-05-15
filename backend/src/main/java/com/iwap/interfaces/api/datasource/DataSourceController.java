// 데이터 소스 조회 REST 컨트롤러 — GET /api/data-sources
package com.iwap.interfaces.api.datasource;

import com.iwap.application.datasource.DataSourceResult;
import com.iwap.application.datasource.DataSourceService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/data-sources")
public class DataSourceController {

    private final DataSourceService service;

    public DataSourceController(DataSourceService service) {
        this.service = service;
    }

    @GetMapping
    public List<DataSourceResult> list() {
        return service.availableSources();
    }

    @GetMapping("/{type}")
    public DataSourceResult get(@PathVariable String type) {
        return service.load(type);
    }
}
