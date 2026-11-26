package com.telecom.network_monitor.search;

import com.telecom.network_monitor.exception.BadRequestException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Set;

/**
 * Builds a safe {@link Pageable} from request parameters: page size is capped and only
 * whitelisted properties may be sorted on (anything else would be a 500 from JPA).
 */
public final class SortSupport {

    public static final int MAX_PAGE_SIZE = 100;

    private SortSupport() {
    }

    /**
     * @param sort "property" or "property,asc|desc"
     */
    public static Pageable pageable(int page, int size, String sort, Set<String> allowed, String defaultSort) {
        if (page < 0) {
            throw new BadRequestException("page must be 0 or greater");
        }
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return PageRequest.of(page, safeSize, parseSort(sort == null || sort.isBlank() ? defaultSort : sort, allowed));
    }

    static Sort parseSort(String sort, Set<String> allowed) {
        String[] parts = sort.split(",");
        String property = parts[0].trim();
        if (!allowed.contains(property)) {
            throw new BadRequestException("Cannot sort by '" + property + "'. Allowed: " + allowed);
        }
        Sort.Direction direction = parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc")
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        // Secondary sort on id keeps pagination stable when values are equal
        Sort primary = Sort.by(direction, property);
        return property.equals("id") ? primary : primary.and(Sort.by(Sort.Direction.DESC, "id"));
    }
}
