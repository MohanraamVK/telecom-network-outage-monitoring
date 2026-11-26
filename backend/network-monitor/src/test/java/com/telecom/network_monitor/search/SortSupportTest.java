package com.telecom.network_monitor.search;

import com.telecom.network_monitor.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SortSupportTest {

    private static final Set<String> ALLOWED = Set.of("id", "name");

    @Test
    void parsesPropertyAndDirection() {
        Pageable pageable = SortSupport.pageable(2, 25, "name,desc", ALLOWED, "id");

        assertThat(pageable.getPageNumber()).isEqualTo(2);
        assertThat(pageable.getPageSize()).isEqualTo(25);
        assertThat(pageable.getSort().getOrderFor("name").getDirection()).isEqualTo(Sort.Direction.DESC);
        assertThat(pageable.getSort().getOrderFor("id")).isNotNull(); // stable tie-breaker
    }

    @Test
    void usesDefaultSortAndCapsPageSize() {
        Pageable pageable = SortSupport.pageable(0, 10_000, null, ALLOWED, "id,asc");

        assertThat(pageable.getPageSize()).isEqualTo(SortSupport.MAX_PAGE_SIZE);
        assertThat(pageable.getSort().getOrderFor("id").getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    void rejectsUnknownSortProperty() {
        assertThatThrownBy(() -> SortSupport.pageable(0, 10, "password", ALLOWED, "id"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot sort by 'password'");
    }

    @Test
    void rejectsNegativePage() {
        assertThatThrownBy(() -> SortSupport.pageable(-1, 10, null, ALLOWED, "id"))
                .isInstanceOf(BadRequestException.class);
    }
}
