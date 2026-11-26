package com.telecom.network_monitor.search;

import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.IncidentSeverity;
import com.telecom.network_monitor.enums.IncidentStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Filters for GET /api/incidents/search, translated into a JPA query. */
public record IncidentSearchCriteria(
        String query,
        IncidentStatus status,
        IncidentSeverity severity,
        Long nodeId,
        boolean deleted
) {

    public Specification<Incident> toSpecification() {
        return toSpecification(null);
    }

    /**
     * @param severityOrder when set, orders by severity rank (LOW < MEDIUM < HIGH < CRITICAL)
     *                      instead of alphabetically, which a plain ORDER BY on the text column would do
     */
    public Specification<Incident> toSpecification(org.springframework.data.domain.Sort.Direction severityOrder) {
        return (root, criteriaQuery, cb) -> {
            boolean isCountQuery = criteriaQuery.getResultType() == Long.class || criteriaQuery.getResultType() == long.class;
            if (severityOrder != null && !isCountQuery) {
                var rank = cb.<Integer>selectCase()
                        .when(cb.equal(root.get("severity"), IncidentSeverity.CRITICAL), 4)
                        .when(cb.equal(root.get("severity"), IncidentSeverity.HIGH), 3)
                        .when(cb.equal(root.get("severity"), IncidentSeverity.MEDIUM), 2)
                        .otherwise(1);
                criteriaQuery.orderBy(
                        severityOrder.isAscending() ? cb.asc(rank) : cb.desc(rank),
                        cb.desc(root.get("createdAt")),
                        cb.desc(root.get("id")));
            }
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), deleted));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (severity != null) {
                predicates.add(cb.equal(root.get("severity"), severity));
            }
            if (nodeId != null) {
                predicates.add(cb.equal(root.get("node").get("id"), nodeId));
            }
            if (query != null && !query.isBlank()) {
                String like = "%" + escapeLike(query.trim().toLowerCase(Locale.ROOT)) + "%";
                Join<Incident, Node> node = root.join("node", JoinType.LEFT);
                List<Predicate> text = new ArrayList<>();
                text.add(cb.like(cb.lower(root.get("description")), like, '\\'));
                text.add(cb.like(cb.lower(node.get("name")), like, '\\'));
                parseId(query).ifPresent(id -> text.add(cb.equal(root.get("id"), id)));
                predicates.add(cb.or(text.toArray(Predicate[]::new)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    static java.util.Optional<Long> parseId(String query) {
        String trimmed = query.trim().replaceFirst("^#", "");
        try {
            return java.util.Optional.of(Long.parseLong(trimmed));
        } catch (NumberFormatException ex) {
            return java.util.Optional.empty();
        }
    }
}
