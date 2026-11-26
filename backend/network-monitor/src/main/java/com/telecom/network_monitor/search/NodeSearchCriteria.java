package com.telecom.network_monitor.search;

import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.NodeStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Filters for GET /api/nodes/search, translated into a JPA query. */
public record NodeSearchCriteria(String query, NodeStatus status, boolean deleted) {

    public Specification<Node> toSpecification() {
        return (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), deleted));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (query != null && !query.isBlank()) {
                String like = "%" + IncidentSearchCriteria.escapeLike(query.trim().toLowerCase(Locale.ROOT)) + "%";
                List<Predicate> text = new ArrayList<>();
                text.add(cb.like(cb.lower(root.get("name")), like, '\\'));
                text.add(cb.like(cb.lower(root.get("location")), like, '\\'));
                IncidentSearchCriteria.parseId(query).ifPresent(id -> text.add(cb.equal(root.get("id"), id)));
                predicates.add(cb.or(text.toArray(Predicate[]::new)));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
