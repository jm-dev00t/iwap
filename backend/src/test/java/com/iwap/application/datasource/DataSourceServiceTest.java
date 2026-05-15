package com.iwap.application.datasource;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;

class DataSourceServiceTest {

    private final DataSourceService service = new DataSourceService();

    @Test
    void availableSourcesReturnsAllFourTypes() {
        var sources = service.availableSources();
        assertThat(sources).extracting("type")
                .containsExactlyInAnyOrder("sales", "inventory", "customers", "weekly");
    }

    @Test
    void loadSalesReturnsRowsWithCorrectHeaders() {
        var response = service.load("sales");
        assertThat(response.headers()).containsExactly("month", "channel", "revenue", "orders", "gross_margin");
        assertThat(response.rows()).isNotEmpty();
    }

    @Test
    void loadUnknownTypeThrowsIllegalArgument() {
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.load("unknown"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
